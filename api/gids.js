// gids.kadoly.com: keuzehulpen van Kadoly zelf, voor zoekers in Google en AI-assistenten (Henkjan 30 okt 2026: "We gaan Kadoly.help maken
// en daar keuzehulpen maken voor alle content van Kadoly ... de long game om te verkopen via SEO en LLM ... Dit is ons LAB ook voor Kadoly";
// op de vraag waar: "gids.kadoly.com"). Plan en werkwijze: OVERDRACHT-KADOLY-GIDS.md.
// Regels: eerst de lijst met prijs en levertijd van vandaag, de keuzehulp als knop eronder; per product een eerlijke beperking; afraden alleen
// op harde feiten (maat, onderdelen, levertijd tegenover een deadline), want we hebben de producten niet zelf vastgehad (Henkjan: nog niet
// zelf bestellen). Alles wat AI moet kunnen citeren staat in de HTML. Geen gedachtestreepjes. Prijzen live uit de shopcatalogus.
// Kliks naar de shop gaan via /naar/<pid> (api/shop.js op=gidsuit): Clickmind meet de keten tot betaald per gids.
import { catalogusInhoud } from '../lib/gids-catalogus.js';
import { gidsIndexPlan } from '../lib/gids-indexnow.js';
import { kv } from '../lib/db.js';
import { lookNieuw } from '../lib/look.js';
import { GIDSEN, GIDS_IDS } from '../lib/gidsen-kadoly.js';
import { alleVan } from '../lib/gidsen-alle.js'; // alles van een soort onder de keuze (10 nov 2026)
import { berichten, HAIKU } from '../lib/ai.js';
import { createHash } from 'node:crypto';
import { ONDERZOEK, BRONNEN, ONDERZOEK_DAG, onderwerpDag, bronnenHtml, adviesBlok, bronLink, dekking, onderzoekHub, onderzoekPagina, onderzoekTekst } from '../lib/gids-onderzoek.js';
import { bronScript, groeiRonde, groeiStand, groeiHtml } from '../lib/gids-groei.js';
import * as NB from '../lib/kadoly-nieuws.js'; // aanmelding mail en meldingen (2 nov 2026)

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

function ldJson(g, items, A) {
  const org = { '@type': 'Organization', '@id': HOST + '/#org', name: 'Kadoly', url: 'https://kadoly.com' };
  const lijst = { '@type': 'ItemList', name: g.h1, itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: x.naam, image: x.img || undefined, brand: x.merk ? { '@type': 'Brand', name: x.merk } : undefined, description: x.waarom, offers: { '@type': 'Offer', price: N(x.prijs).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://kadoly.com/product/' + x.pid, shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: N(x.verzending).toFixed(2), currency: 'EUR' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NL' } } } } })) };
  const faq = g.faq && g.faq.length ? { '@type': 'FAQPage', mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f.v, acceptedAnswer: { '@type': 'Answer', text: f.a } })) } : null;
  const kruim = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: g.h1, item: HOST + '/' + g.slug }] };
  const art = { '@type': 'Article', headline: g.h1, dateModified: g.bijgewerkt, author: { '@id': HOST + '/#org' }, publisher: { '@id': HOST + '/#org' }, mainEntityOfPage: HOST + '/' + g.slug, citation:g.bronnen?.map(id => BRONNEN[id]?.url).filter(Boolean) };
  // Per gids uitrollen: bestaande vergelijkbare proef-/controlepagina's blijven gelijk.
  const schemaAlle = A && (g.alleSchemaVolledig ? A.groepen.flatMap(gr => gr.items) : A.lijst.slice(0, 50));
  const alleL = A && A.n ? { '@type': 'ItemList', name: A.def.kop + ' bij Kadoly', numberOfItems: g.alleSchemaVolledig ? schemaAlle.length : A.totaal, itemListElement: schemaAlle.map((i, k) => ({ '@type': 'ListItem', position: k + 1, name: i.t, url: 'https://kadoly.com/product/' + i.id })) } : null;
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, art, kruim, lijst, alleL, faq].filter(Boolean) }).replace(/</g, '\\u003c');
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
.kh .opt.on{background:var(--prim);border-color:var(--prim);color:var(--on-prim)}.kh h2{font-size:20px;margin:24px 0 10px}.kh>h2:first-child{margin-top:0}.opt .tel{font-size:inherit;font-weight:400;margin-left:7px}.kh .pk{margin-top:14px}.cards a.card{text-decoration:none!important}.card .cat{opacity:1}
.rg{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr));margin:18px 0 0}.rk{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:16px;padding:14px;text-decoration:none!important;color:var(--ink)}.rk:hover{border-color:var(--acc)}.rk-img{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 6px}.rk-img img,.rk-img i{width:100%;height:auto;min-width:0;aspect-ratio:1;object-fit:cover;border-radius:10px;background:var(--bg-2);display:block}.rk h3{margin:0;font-size:20px}.rk p{margin:0;font-size:16px}
.pg{display:grid;gap:14px;grid-template-columns:repeat(4,minmax(0,1fr));margin:14px 0 8px}.mk{display:flex;flex-direction:column;gap:3px;text-decoration:none!important;color:var(--ink);font-size:16px;line-height:1.35}.mk img,.mk-leeg{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;background:var(--bg-2);display:block;margin:0 0 6px;border:1px solid var(--line)}.mk:hover img{border-color:var(--acc)}.mk-n{font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.mk-p b{font-size:18px}.tel{font-weight:400;font-size:18px}
@media(max-width:820px){.rg{grid-template-columns:repeat(2,minmax(0,1fr))}.pg{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.rg{grid-template-columns:1fr}}
@media(max-width:640px){.pk{grid-template-columns:84px 1fr;gap:14px;padding:16px}.pk-img img{width:84px;height:84px}dl.rows .r{grid-template-columns:1fr;gap:4px}}`;

function kop(titel, besch, pad, extra, zoekQ) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(besch)}"><link rel="canonical" href="${HOST}${pad}">${META ? `<meta name="google-site-verification" content="${esc(META)}">` : ''}<meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(besch)}"><meta property="og:url" content="${HOST}${pad}"><meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><link rel="icon" type="image/svg+xml" href="https://cdn.kadoly.com/icon/shop/shop-mark.svg?v=1"><link rel="icon" type="image/png" sizes="32x32" href="https://cdn.kadoly.com/icon/shop/icon-32.png?v=1"><link rel="apple-touch-icon" sizes="180x180" href="https://cdn.kadoly.com/icon/shop/apple-180.png?v=1"><meta name="theme-color" content="#ffffff">${extra || ''}<style>${lookNieuw(ACC)}${CSS_KADOLY}${CSS_GIDS}${NB.NB_CSS}</style></head><body>${KOPBALK(zoekQ)}<main class="wrap">`;
}
// merkteken van kadoly.com zelf (kop van kadoly.com, 30 okt uitgelezen)
const MERK = s => `<svg width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9" fill="#1D9BF0"/><path d="M17 21l-7-8M17 21l7-8M13 14l-3-1 .6 3.1M23.4 16.1L24 13l-3 1" stroke="#D6ECFC" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M17 28V8M18.6 10.8L17 8l-1.6 2.8" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const SHOPMERK = s => `<svg width="${s}" height="${s}" viewBox="0 0 34 34" aria-hidden="true" focusable="false"><rect width="34" height="34" rx="9" fill="#1D9BF0"/><path d="M9 13h14M19 9l4 4-4 4" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M25 21H11M15 25l-4-4 4-4" stroke="#D6ECFC" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const KOPBALK = zq => `<header class="kn"><div class="kn-in"><a class="kn-merk" href="/" aria-label="Kadoly gids">${SHOPMERK(30)}<span>Kadoly</span><span class="kn-gids">Gids</span></a><form class="kn-zoek" role="search" action="/zoek" method="get" id="kf"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input type="search" name="q" id="kq" value="${esc(zq || '')}" placeholder="Zoek in Kadoly of stel een vraag" aria-label="Zoek in Kadoly of stel een vraag" autocomplete="off" maxlength="160" enterkeyhint="search" role="combobox" aria-expanded="false" aria-controls="kz"><div class="kz" id="kz" role="listbox" hidden></div></form><a class="kn-shop" href="https://kadoly.com/shop?utm_source=kadoly-gids&amp;utm_medium=gids&amp;utm_campaign=kop">${SHOPMERK(22)}<span>Shop</span></a></div></header>`;
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
const VOET = (g, kans) => `${NB.blok(g ? g.slug : '_home', { mail: MAILK, info: NBI })}<hr style="border:0;border-top:1px solid var(--line);margin:44px 0 18px"><p class="meta">Een gids van <a href="https://kadoly.com">Kadoly</a>, de webshop met producten van makers. Prijzen en levertijden komen elke paar minuten uit de winkel zelf${g ? ', laatst inhoudelijk bijgewerkt op ' + esc(g.bijgewerkt) : ''}. Wij verdienen aan een bestelling in onze eigen winkel; daarom staat bij elk product ook waarvoor het niet geschikt is.</p><p class="meta"><a href="/">Alle gidsen</a> · <a href="/onderzoek-en-bronnen">Onderzoek en bronnen</a> · <a href="#" data-kc>Stel een vraag</a></p></main>${VOETBALK}${CHAT}${hulpScript(g ? g.slug : '_home', kans)}${NB.NB_SCRIPT}</body></html>`;

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
const CHAT_SYS = `Je bent de hulp van Kadoly (kadoly.com), een Nederlandse webshop van ADSFAIR B.V. met producten van makers (wonen, hobby, keuken, beauty, kinderen, mode, tech en meer). Je helpt bezoekers van gids.kadoly.com kiezen en beantwoordt hun vragen.
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
<p class="pk-lab"><span class="pk-nr">${nr}</span>${esc(x.label)}${x.meest ? ' · meest aangeklikt door lezers' : ''}</p><h3>${esc(x.naam)}</h3>
<p class="pk-prijs"><b>${euro(x.prijs + x.verzending)}</b> inclusief ${x.verzending ? euro(x.verzending) + ' verzending (eerste bestelling gratis verzonden: ' + euro(x.prijs) + ')' : 'verzending'}${x.lt ? ` · <span class="pk-dag">in huis rond ${esc(nlDatum(dat))}</span>` : ''}</p>
<p>${esc(x.waarom)}</p>${x.beperking ? `<p class="pk-let"><b>Let op:</b> ${esc(x.beperking)}</p>` : ''}<a class="btn knop" href="${href}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`;
}

// baken: telt echte lezers in de browser (zodat de pagina aan de rand van Vercel bewaard kan worden): weergave met herkomst, 15 en 60 seconden, scrollen
function baken(slug) {
  return `<script>(function(){var g=${JSON.stringify(slug)},s={};function t(x){if(s[x])return;s[x]=1;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(g)+'&s='+x)}catch(e){}}${bronScript};var b=gidsBron(document.referrer||'');t('v-'+b);setTimeout(function(){if(!document.hidden)t('t15')},15000);setTimeout(function(){if(!document.hidden)t('t60')},60000);addEventListener('scroll',function(){var h=document.documentElement,p=(h.scrollTop+innerHeight)/h.scrollHeight;if(p>.5)t('s50');if(p>.9)t('s90')},{passive:true});})();</script>`;
}
const datumNl = d => { try { return new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
const BESTELLEN = `<dl class="rows"><div class="r"><dt>Betalen</dt><dd>iDEAL, PayPal of creditcard, ook zonder account. Je koopt bij Kadoly (ADSFAIR B.V.).</dd></div><div class="r"><dt>Verzending</dt><dd>Het merk stuurt het pakket rechtstreeks naar jou, met track en trace. Je eerste bestelling wordt gratis verzonden.</dd></div><div class="r"><dt>Retour</dt><dd>14 dagen na ontvangst, met een retourlabel en het hele bedrag terug.</dd></div><div class="r"><dt>Bundelkorting</dt><dd>5% bij 2 producten, oplopend tot 20% bij 6.</dd></div></dl>`;
// alles van deze soort uit de winkel, onder de keuze (lib/gidsen-alle.js); kliks met b=alle tellen in gk:p:<gids> en sturen de volgorde
const alleRij = (i, g) => `<li><a class="nw-a" href="/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&amp;b=alle" rel="nofollow">${i.img ? `<img src="${esc(i.img)}" width="64" height="64" alt="${esc(i.t)}" loading="lazy" decoding="async">` : '<span class="nw-leeg"></span>'}<span class="nw-t"><b>${esc(i.t)}</b>${i.b ? `<span>${esc(i.b)}</span>` : ''}<span><b>${euro(thuis(i))}</b> incl. verzending${N(i.lt) ? ' · in huis rond ' + esc(nlDatum(leverDatum(i.lt))) : ''}</span></span></a></li>`;
function alleHtml(g, A) {
  if (!A || !A.n) return '';
  return `<section id="alle"><h2>${esc(A.def.kop)} bij Kadoly (${A.totaal})</h2><p>Naast onze keuze hierboven: ${A.totaal === 1 ? 'het andere product' : 'alle ' + A.totaal + ' andere producten'} van deze soort die Kadoly nu heeft, van ${euro(A.van)} tot ${euro(A.tot)} inclusief verzending, met de bezorgdag van vandaag. Deze hebben we niet een voor een naast elkaar gezet: lees bij het product wat de maker opgeeft en wat erbij zit.${A.totaal > A.n ? ` We tonen de ${A.n} die lezers hier het vaakst kozen, daarna van laag naar hoog in prijs; de rest staat bij <a href="/alle-producten">alle producten</a>.` : ''}</p>${A.groepen.map(gr => `<h3>${esc(gr.naam)} (${gr.items.length})</h3><ul class="nwl">${gr.items.map(i => alleRij(i, g.slug)).join('')}</ul>`).join('')}</section>`;
}
async function gidsPagina(g) {
  const cat = await catalogus();
  const items = g.keuze.map(k => { const i = cat[k.pid]; if (!i || i.vr === false) return null; return Object.assign({}, k, { naam: k.naam || i.t, prijs: N(i.p), verzending: i.fs ? 0 : N(i.vk), lt: N(i.lt) || 0, img: i.img || '', merk: i.b || '' }); }).filter(Boolean);
  const perPid = {}; items.forEach(x => { perPid[x.pid] = x; });
  // volgorde leert van de lezers: na 60 weergaven telt de klikkans per product (met voorkennis voor de redactievolgorde), daarvoor de redactievolgorde
  const L = await geleerd(g.slug); const vw = N(L._v);
  const A = alleVan(g.slug, g.keuze.map(k => k.pid), cat, L, thuis);
  if (vw >= 60) { items.forEach((x, i) => { x._s = (N(L[x.pid]) + Math.max(0.2, 1.5 - i * 0.2)) / (vw + 30); }); items.sort((a, b) => b._s - a._s); }
  const top = items.reduce((m, x) => (N(L[x.pid]) > N(L[m && m.pid])) ? x : m, null); if (top && N(L[top.pid]) >= 10) top.meest = true;
  const rijen = (g.tabel || []).map(r => { const x = perPid[r.pid]; return `<div class="r"><dt>${esc(r.situatie)}</dt><dd>${esc(r.advies)}${x ? ` <a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(g.slug)}&b=tabel" rel="nofollow">${esc(x.naam)}</a>, ${euro(x.prijs + x.verzending)}` : ''}</dd></div>`; }).join('');
  const checkData = JSON.stringify({ vragen: g.check ? g.check.vragen : [], regels: g.check ? g.check.regels : [], producten: Object.fromEntries(items.map(x => [x.pid, { naam: x.naam, prijs: euro(x.prijs + x.verzending), lt: x.lt }])), slug: g.slug }).replace(/</g, '\\u003c');
  const check = g.check ? `<section class="q" id="check"><h2>Past het bij jou? Snelle check</h2><p>Twee of drie vragen. De uitkomst kan ook zijn dat je het beter niet koopt.</p><form id="gf">${g.check.vragen.map(v => `<fieldset><legend>${esc(v.vraag)}</legend><div class="opts">${v.opties.map(o => `<label class="opt"><input type="radio" name="${esc(v.k)}" value="${esc(o[0])}">${esc(o[1])}</label>`).join('')}</div></fieldset>`).join('')}<button class="btn knop" type="submit">Laat zien wat past</button></form><div class="uitkomst" id="gu" aria-live="polite"></div></section>
<script>(function(){var D=${checkData};var f=document.getElementById('gf'),u=document.getElementById('gu');f.addEventListener('submit',function(e){e.preventDefault();var a={};D.vragen.forEach(function(v){var x=f.querySelector('input[name="'+v.k+'"]:checked');if(x)a[v.k]=x.value;});if(Object.keys(a).length<D.vragen.length){u.innerHTML='<p>Kies bij elke vraag een antwoord.</p>';return;}var r=null;for(var i=0;i<D.regels.length;i++){var R=D.regels[i],ok=true;for(var k in R.als){if(R.als[k].indexOf(a[k])<0){ok=false;break;}}if(ok){r=R;break;}}if(!r){u.innerHTML='<p>Kies bij elke vraag een antwoord.</p>';return;}var h='<div class="answer"><p><strong>'+r.kop+'</strong></p><p>'+r.tekst+'</p>';if(r.pid&&D.producten[r.pid]){var p=D.producten[r.pid];h+='<p style="margin-top:14px"><a class="btn knop" href="/naar/'+encodeURIComponent(r.pid)+'?g='+encodeURIComponent(D.slug)+'&b=check" rel="nofollow">'+p.naam+', '+p.prijs+'</a></p>';}u.innerHTML=h+'</div>';try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(D.slug)+'&s=check-'+(r.id||'x'));}catch(x){}});})();</script>` : '';
  const delen = 'https://wa.me/?text=' + encodeURIComponent(g.h1 + ' ' + HOST + '/' + g.slug);
  const ogImg = items[0] && items[0].img ? `<meta property="og:image" content="${esc(items[0].img)}"><meta name="twitter:card" content="summary_large_image">` : '';
  const andere = GIDS_IDS.filter(id => id !== g.slug).map(id => GIDSEN[id]);
  const toc = [['keuze', 'Onze keuze'], rijen ? ['situatie', 'Welke past bij jou'] : null, g.check ? ['check', 'Snelle check'] : null, (g.uitleg || []).length ? ['uitleg', 'Waar let je op'] : null, ['bestellen', 'Bestellen'], g.faq && g.faq.length ? ['vragen', 'Vragen'] : null, A && A.n ? ['alle', A.def.kop] : null].filter(Boolean);
  return kop(g.titel, g.beschrijving, '/' + g.slug, ogImg + `<script type="application/ld+json">${ldJson(g, items, A)}</script>` + (A && A.n ? NW_CSS : '')) +
    `<article><nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › ${esc(g.h1)}</nav><p class="kicker"><span class="live-dot"></span>${esc(g.kicker)}</p><h1>${esc(g.h1)}</h1>
<p class="meta">Door de redactie van Kadoly · bijgewerkt <time datetime="${esc(g.bijgewerkt)}">${esc(datumNl(g.bijgewerkt))}</time> · prijs en levertijd van vandaag</p>
<div class="answer"><p><strong>In het kort.</strong> ${esc(g.kort)}</p></div>
<nav class="toc" aria-label="Op deze pagina">${toc.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>
<h2 id="keuze">Onze keuze</h2>${items.map((x, i) => productKaart(x, g.slug, 'keuze', i === 0, i + 1)).join('')}
${rijen ? `<h2 id="situatie">${esc(g.tabelKop || 'Welke past bij jouw situatie?')}</h2><dl class="rows">${rijen}</dl>` : ''}
${check}
${(g.uitleg || []).map((b, i) => `<h2${i === 0 ? ' id="uitleg"' : ''}>${esc(b.kop)}</h2>${b.alineas.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2 id="zo-kozen-we">Zo kozen we</h2><p>${esc(g.zoKozenWe)}</p>
${adviesBlok(g.keuze.map(k => cat[k.pid]).filter(Boolean))}
${g.bronnen?.length ? `<section id="bronnen"><h2>Bronnen en beperkingen</h2><p>Externe bronnen, gecontroleerd ${esc(g.bronnenControle || g.bijgewerkt)}. Categorieonderzoek is geen producttest.</p>${bronnenHtml(g.bronnen,g.bronnenControle)}</section>` : ''}
<h2 id="bestellen">Zo werkt een bestelling bij Kadoly</h2>${BESTELLEN}
${g.faq && g.faq.length ? `<h2 id="vragen">Veelgestelde vragen</h2>${g.faq.map(f => `<details class="faq"><summary>${esc(f.v)}</summary><div class="a"><p>${esc(f.a)}</p></div></details>`).join('')}` : ''}
${alleHtml(g, A)}
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
  RUB = Object.values(m).filter(r => r.n >= 1).sort((a, b) => (a.c === 'overig') - (b.c === 'overig') || b.n - a.n); RUB_AT = CAT_AT; return RUB; }
const mediaan = l => { if (!l.length) return 0; const x = l.slice().sort((a, b) => a - b); return x[Math.floor(x.length / 2)]; };
const rang = (L, vw) => (a, b) => { const la = vw >= 60 ? N(L[a.id]) / (vw + 30) : 0, lb = vw >= 60 ? N(L[b.id]) / (vw + 30) : 0; return (lb - la) || (N(b.sc) - N(a.sc)) || (N(b.v) - N(a.v)) || (N(b.f) - N(a.f)); };
const miniKaart = (i, g, b, eerste) => { const href = `/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&b=${b}`; return `<a class="mk" href="${href}" rel="nofollow">${i.img ? `<img src="${esc(i.img)}" width="240" height="240" alt="${esc(i.t)}" ${eerste ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : '<span class="mk-leeg"></span>'}<span class="mk-n">${esc(i.t)}</span>${i.b ? `<span>${esc(i.b)}</span>` : ''}<span class="mk-p"><b>${euro(thuis(i))}</b> incl. verzending</span>${N(i.lt) ? `<span>in huis rond ${esc(nlDatum(leverDatum(i.lt)))}</span>` : ''}</a>`; };
const prodLd = i => ({ '@type': 'Product', name: i.t, image: i.img || undefined, brand: i.b ? { '@type': 'Brand', name: i.b } : undefined, offers: { '@type': 'Offer', price: N(i.p).toFixed(2), priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: 'https://kadoly.com/product/' + i.id, shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: i.fs ? '0.00' : N(i.vk).toFixed(2), currency: 'EUR' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NL' } } } });
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
  const g = 'r-' + c; const med = mediaan(R.lts); const top = R.items.slice().sort(rang({}, 0)).slice(0, 10); const nw = (await nieuwe()).filter(i => sleutel(i.c) === c);
  const subs = Object.entries(R.subs).sort((a, b) => (a[0] === 'overig') - (b[0] === 'overig') || b[1].length - a[1].length);
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebPage', name: R.naam + ': wat past bij jou?', url: HOST + '/rubriek/' + c, publisher: { '@id': HOST + '/#org' }, dateModified: ONDERZOEK_DAG }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: R.naam, item: HOST + '/rubriek/' + c }] }, { '@type': 'ItemList', name: 'Populair in ' + R.naam, itemListElement: top.map((i, k) => ({ '@type': 'ListItem', position: k + 1, item: prodLd(i) })) }].concat(nw.length ? [{ '@type': 'ItemList', name: 'Nieuw in ' + R.naam, numberOfItems: nw.length, itemListOrder: 'https://schema.org/ItemListOrderDescending', itemListElement: nw.slice(0, NIEUW_RUB).map((i, k) => ({ '@type': 'ListItem', position: k + 1, item: prodLd(i) })) }] : []) }).replace(/</g, '\\u003c');
  const kort = `Bij Kadoly vind je ${R.n} producten in ${R.naam.toLowerCase()}, van ${euro(R.min)} tot ${euro(R.max)} inclusief verzending.${med ? ` De meeste zijn binnen ${med} werkdagen in huis.` : ''}${nw.length ? ` In de afgelopen ${NIEUW_DAGEN} dagen ${nw.length === 1 ? 'kwam er 1 nieuw product' : 'kwamen er ' + nw.length + ' nieuwe producten'} bij.` : ''} Kies hieronder soort, budget en wanneer je het nodig hebt: je krijgt de 3 die het best passen, en we zeggen het eerlijk als niets past.`;
  return kop(`${R.naam}: wat past bij jou? Keuzehulp van Kadoly`, `Keuzehulp ${R.naam.toLowerCase()}: ${R.n} producten, kies op soort, budget en levertijd. Met prijs inclusief verzending en bezorgdag van vandaag.`, '/rubriek/' + c, `<script type="application/ld+json">${ld}</script>${NW_CSS}`) +
    `<nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › ${esc(R.naam)}</nav><p class="kicker"><span class="live-dot"></span>Keuzehulp</p><h1>${esc(R.naam)}: wat past bij jou?</h1>
<p class="meta">Door de redactie van Kadoly · catalogus van <time datetime="${DAG()}">${esc(datumNl(DAG()))}</time> · prijs en levertijd van vandaag</p><div class="answer"><p><strong>In het kort.</strong> ${esc(kort)}</p></div>
${keuzeHulp(alle, c, g)}
<p><a href="/alle-producten#alle-${esc(c)}">Bekijk alle ${R.n} producten in ${esc(R.naam.toLowerCase())}</a></p>
<h2 id="aanbod">Wat er is in ${esc(R.naam.toLowerCase())}</h2><dl class="rows">${subs.map(([sb, l]) => soortRegel(R, sb, l, g)).join('')}</dl>
${nw.length ? `<h2 id="nieuw">Nieuw in ${esc(R.naam.toLowerCase())}</h2><p class="meta">${nw.length === 1 ? '1 product' : nw.length + ' producten'} uit de afgelopen ${NIEUW_DAGEN} dagen${nw.length > NIEUW_RUB ? ', hier de ' + NIEUW_RUB + ' nieuwste' : ''}. <a href="${NIEUW_PAD}#n-${esc(c)}">${nw.length > NIEUW_RUB ? 'Alle ' + nw.length + ' nieuwe in ' + esc(R.naam.toLowerCase()) + ', per soort' : 'Alles wat nieuw is bij Kadoly'}</a></p><ul class="nwl">${nw.slice(0, NIEUW_RUB).map(i => nieuwRij(i, g)).join('')}</ul>` : ''}
${adviesBlok(R.items)}
<h2 id="bestellen">Zo werkt een bestelling bij Kadoly</h2>${BESTELLEN}${baken(g)}` + VOET(null, kans);
}

// Nieuw bij Kadoly (4 nov 2026, Henkjan: "Update gids.kadoly.com met alle nieuw produckten en optimaliseer voor SEO en LLM"): elk product dat
// de afgelopen 14 dagen in de winkel kwam (launched_at uit de shop, veld l), per rubriek en soort, allemaal in de HTML zelf. De hele winkel is pas sinds
// begin oktober open (bijna alles kwam 5 tot 19 okt), dus 14 dagen = de echte nieuwe golf (3 en 4 nov: 766). Op elke rubriekpagina de NIEUW_RUB nieuwste
// met een link hierheen; in llms-full.txt staan ze allemaal (plus de hele winkel).
const NIEUW_DAGEN = 14, NIEUW_PAD = '/nieuw-bij-kadoly', NIEUW_RUB = 24;
const dagVan = ms => new Date(N(ms)).toISOString().slice(0, 10);
const datumKort = ms => new Date(N(ms)).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long' });
const opsom = l => l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' en ' + l[l.length - 1];
let NW = null, NW_AT = -1;
async function nieuwe() { const cat = await catalogus(); if (NW && NW_AT === CAT_AT) return NW; const nu = Date.now(), grens = nu - NIEUW_DAGEN * 864e5;
  NW = Object.values(cat).filter(i => i && i.id && i.t && i.vr !== false && N(i.l) >= grens && N(i.l) <= nu + 864e5 && thuis(i) > 0).sort((a, b) => N(b.l) - N(a.l) || N(b.sc) - N(a.sc)); NW_AT = CAT_AT; return NW; }
const nieuwRij = (i, g, eerste) => { const sb = sleutel(i.s); const wie = [i.b ? esc(i.b) : '', sb !== 'overig' ? esc(naamS(sb)) : ''].filter(Boolean).join(' · ');
  return `<li><a class="nw-a" href="/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&amp;b=nieuw" rel="nofollow">${i.img ? `<img src="${esc(i.img)}" width="64" height="64" alt="${esc(i.t)}" ${eerste ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : '<span class="nw-leeg"></span>'}<span class="nw-t"><b>${esc(i.t)}</b>${wie ? `<span>${wie}</span>` : ''}<span><b>${euro(thuis(i))}</b> incl. verzending${N(i.lt) ? ' · in huis rond ' + esc(nlDatum(leverDatum(i.lt))) : ''}</span><span class="nw-d">Nieuw sinds <time datetime="${dagVan(i.l)}">${esc(datumKort(i.l))}</time></span></span></a>${bronLink(i)}</li>`; };
const NW_CSS = '<style>.nwl{list-style:none;padding:0;margin:0 0 18px;display:grid;gap:8px}.nwl li{margin:0}.nw-a{display:flex;gap:12px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:14px;color:var(--ink);text-decoration:none}.nw-a:hover{border-color:var(--acc)}.nw-a img,.nw-leeg{width:64px;height:64px;border-radius:10px;object-fit:cover;flex:none;background:var(--bg-2)}.nw-t{display:grid;gap:2px;font-size:15px;line-height:1.35;min-width:0}.nw-t>b{font-size:16px}.nw-d{font-size:13px;opacity:.75}</style>';
async function nieuwFeiten() { const L = await nieuwe(); const per = {}; for (const i of L) { const c = sleutel(i.c); (per[c] = per[c] || []).push(i); }
  const groepen = Object.entries(per).sort((a, b) => (a[0] === 'overig') - (b[0] === 'overig') || b[1].length - a[1].length);
  const merk = new Map(); L.forEach(i => { if (i.b) merk.set(i.b, (merk.get(i.b) || 0) + 1); }); const topMerken = [...merk.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]);
  const pr = L.map(thuis).filter(x => x > 0), med = mediaan(L.map(i => N(i.lt)).filter(Boolean)), n = L.length, nieuwste = L[0] ? dagVan(L[0].l) : DAG();
  const kort = n ? `In de afgelopen ${NIEUW_DAGEN} dagen kwamen er ${n} producten bij in de winkel van Kadoly, van ${merk.size} makers. De meeste nieuwe zitten in ${opsom(groepen.slice(0, 3).map(([c, l]) => naamR(c).toLowerCase() + ' (' + l.length + ')'))}. Ze kosten ${euro(Math.min(...pr))} tot ${euro(Math.max(...pr))} inclusief verzending${med ? `, en de meeste zijn binnen ${med} werkdagen in huis` : ''}. Het nieuwste kwam binnen op ${datumNl(nieuwste)}.` : `In de afgelopen ${NIEUW_DAGEN} dagen kwamen er geen nieuwe producten bij in de winkel van Kadoly.`;
  const faq = n ? [['Wat is er nieuw bij Kadoly?', `${n} producten in de afgelopen ${NIEUW_DAGEN} dagen, vooral in ${opsom(groepen.slice(0, 3).map(([c]) => naamR(c).toLowerCase()))}. Op ${HOST}${NIEUW_PAD} staan ze per rubriek, het nieuwste bovenaan, met prijs inclusief verzending en bezorgdag.`],
    ...(merk.size ? [['Van welke makers zijn de nieuwe producten?', `Van ${merk.size} makers. De meeste nieuwe producten komen van ${opsom(topMerken)}.`]] : []),
    ['Hoe vaak komt er iets nieuws bij Kadoly?', `In de afgelopen ${NIEUW_DAGEN} dagen gemiddeld ${Math.max(1, Math.round(n / NIEUW_DAGEN * 7))} per week. Deze lijst werkt zichzelf bij zodra er iets nieuws in de winkel staat.`],
    ['Hoe snel is een nieuw product in huis?', `Dat verschilt per maker. ${med ? `De meeste nieuwe producten zijn binnen ${med} werkdagen in huis. ` : ''}Bij elk product staat de verwachte bezorgdag als je vandaag bestelt.`],
    ['Kan ik een nieuw product terugsturen?', 'Ja, zoals alles bij Kadoly: binnen 14 dagen na ontvangst, met een retourlabel en het hele bedrag terug.']] : [];
  return { L, n, groepen, merk, topMerken, med, nieuwste, kort, faq }; }
async function nieuwPagina(kans) {
  const F = await nieuwFeiten(); const R = await rubrieken(); const pad = NIEUW_PAD;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'CollectionPage', '@id': HOST + pad, name: 'Nieuw bij Kadoly', description: F.kort, url: HOST + pad, inLanguage: 'nl-NL', isPartOf: { '@type': 'WebSite', name: 'Kadoly gids', url: HOST + '/' }, publisher: { '@id': HOST + '/#org' }, dateModified: F.nieuwste }, { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: 'Nieuw bij Kadoly', item: HOST + pad }] }, { '@type': 'ItemList', name: 'Nieuw bij Kadoly', numberOfItems: F.n, itemListOrder: 'https://schema.org/ItemListOrderDescending', itemListElement: F.L.slice(0, 60).map((i, k) => ({ '@type': 'ListItem', position: k + 1, item: prodLd(i) })) }].concat(F.faq.length ? [{ '@type': 'FAQPage', mainEntity: F.faq.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }] : []) }).replace(/</g, '\\u003c');
  let eerste = true; const blok = F.groepen.map(([c, l]) => { const heeft = R.some(r => r.c === c); const ps = {}; for (const i of l) { const sb = sleutel(i.s); (ps[sb] = ps[sb] || []).push(i); }
    const soorten = Object.entries(ps).sort((a, b) => (a[0] === 'overig') - (b[0] === 'overig') || b[1].length - a[1].length);
    return `<h2 id="n-${esc(c)}">Nieuw in ${esc(naamR(c).toLowerCase())} <span class="tel">${l.length}</span></h2>${heeft ? `<p class="meta">Kiezen op budget en bezorgdag: <a href="/rubriek/${esc(c)}">keuzehulp ${esc(naamR(c).toLowerCase())}</a></p>` : ''}` + soorten.map(([sb, ll]) => `${soorten.length > 1 ? `<h3 id="n-${esc(c)}-${esc(sb)}">${esc(naamS(sb))} <span class="tel">${ll.length}</span></h3>` : ''}<ul class="nwl">${ll.map(i => { const h = nieuwRij(i, '_nieuw', eerste); eerste = false; return h; }).join('')}</ul>`).join(''); }).join('');
  return kop('Nieuw bij Kadoly: de nieuwste producten per rubriek', `Alle ${F.n} producten die de afgelopen ${NIEUW_DAGEN} dagen nieuw zijn bij Kadoly, per rubriek en soort, met prijs inclusief verzending en bezorgdag van vandaag.`, pad, `<script type="application/ld+json">${ld}</script>${NW_CSS}`) +
    `<nav class="crumbs" aria-label="Kruimelpad"><a href="/">Kadoly gids</a> › Nieuw bij Kadoly</nav><p class="kicker"><span class="live-dot"></span>Nieuw binnen</p><h1>Nieuw bij Kadoly</h1>
<p class="meta">Door de redactie van Kadoly · lijst bijgewerkt <time datetime="${F.nieuwste}">${esc(datumNl(F.nieuwste))}</time> · prijs en levertijd van vandaag</p><div class="answer"><p><strong>In het kort.</strong> ${esc(F.kort)}</p></div>
${F.groepen.length > 1 ? `<ul class="toc">${F.groepen.map(([c, l]) => `<li><a href="#n-${esc(c)}">${esc(naamR(c))} (${l.length})</a></li>`).join('')}</ul>` : ''}${blok}
<p class="meta">Liever kiezen op budget en bezorgdag? <a href="/#kiezen">Gebruik de keuzehulp</a> of <a href="#" data-kc>stel een vraag</a>.</p>
${F.faq.length ? `<h2 id="vragen">Vragen over nieuwe producten</h2>${F.faq.map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}` : ''}
<h2 id="bestellen">Zo werkt een bestelling bij Kadoly</h2>${BESTELLEN}${baken('_nieuw')}` + VOET(null, kans);
}
// Volledig toegankelijk aanbod, ook buiten het venster Nieuw en de populaire voorbeelden.
async function alleProducten(kans) {
  const {lijst, html} = catalogusInhoud(Object.values(await catalogus()), {
    rubriek: c => ({id:sleutel(c),naam:naamR(sleutel(c))}), soort: s => naamS(sleutel(s)),
    prijs: i => N(i.p)>0 ? euro(thuis(i)) : 'Prijs niet opgegeven',
    bezorgdag: i => N(i.lt)>0 ? 'Rond '+nlDatum(leverDatum(i.lt)) : 'Levertijd niet opgegeven', koopcheck: bronLink
  });
  const ld=JSON.stringify({'@context':'https://schema.org','@graph':[ORG,{'@type':'CollectionPage',name:'Alle producten bij Kadoly',url:HOST+'/alle-producten',inLanguage:'nl-NL'}, {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Kadoly gids',item:HOST+'/'},{'@type':'ListItem',position:2,name:'Alle producten',item:HOST+'/alle-producten'}]}, {'@type':'ItemList',numberOfItems:lijst.length,itemListElement:lijst.map((i,k)=>({'@type':'ListItem',position:k+1,name:i.t,url:'https://kadoly.com/product/'+encodeURIComponent(i.id)}))}]}).replace(/</g,'\\u003c');
  return kop('Alle producten bij Kadoly: compleet overzicht', 'Blader door alle beschikbare producten per rubriek. Met actuele prijs inclusief verzending, verwachte bezorgdag en passende koopchecks.', '/alle-producten', '<script type="application/ld+json">'+ld+'</script>') +
    `<nav class="crumbs"><a href="/">Kadoly gids</a> › Alle producten</nav><p class="kicker" id="top">Het volledige aanbod</p><h1>Alle producten bij Kadoly</h1><p class="meta">Catalogusstand <time datetime="${DAG()}">${esc(datumNl(DAG()))}</time>. Prijzen, beschikbaarheid en levertijden komen uit de winkelcatalogus.</p><div class="answer"><p>Blader door alle ${lijst.length} beschikbare producten, per rubriek. Ook producten die niet meer nieuw zijn of niet bij de populaire voorbeelden staan, vind je hier. De verwachte bezorgdag is een schatting als je vandaag bestelt.</p></div><p>Een plek in dit overzicht is geen aanbeveling of kwaliteitsoordeel. <a href="/onderzoek-en-bronnen">Externe koopchecks</a> staan alleen bij inhoudelijk passende producten en zijn geen tests van het exacte model. Uitverkochte producten verdwijnen uit dit overzicht. <a href="/nieuw-bij-kadoly">Bekijk wat nieuw is</a> of <a href="/#kiezen">gebruik de keuzehulp</a>.</p>${html}${baken('catalogus')}` + VOET(null,kans);
}
// productregel voor llms.txt en llms-full.txt
const llmRegel = (i, metNieuw) => '- ' + i.t + (i.b ? ' (' + i.b + ')' : '') + ': ' + euro(thuis(i)) + ' inclusief verzending' + (N(i.lt) ? ', ' + N(i.lt) + ' werkdagen' : '') + (metNieuw && N(i.l) >= Date.now() - NIEUW_DAGEN * 864e5 ? ', nieuw sinds ' + dagVan(i.l) : '') + ', https://kadoly.com/product/' + i.id;

async function home(kans) {
  const R = await rubrieken(); const alle = R.reduce((t, r) => t + r.n, 0); const med = mediaan(R.flatMap(r => r.lts)); const NF = await nieuwFeiten();
  const faq = [['Wat is Kadoly?', `Kadoly is een Nederlandse webshop van ADSFAIR B.V. uit Gouda met ${alle} producten van makers, in ${R.filter(r => r.c !== 'overig').map(r => r.naam.toLowerCase()).join(', ')}.`],
    ['Wie verstuurt mijn bestelling?', 'Het merk of de maker stuurt het pakket rechtstreeks naar jou, met track en trace. Je koopt en betaalt bij Kadoly.'],
    ['Hoe snel is het in huis?', `Dat verschilt per maker. ${med ? `De meeste producten zijn binnen ${med} werkdagen in huis. ` : ''}Bij elk product staat de verwachte bezorgdag als je vandaag bestelt.`],
    ['Kan ik iets terugsturen?', 'Ja. Je hebt 14 dagen na ontvangst, je krijgt een retourlabel en het hele bedrag terug.'],
    ['Hoe betaal ik?', 'Met iDEAL, PayPal of creditcard. Een account is niet nodig.'],
    ['Krijg ik korting als ik meer koop?', 'Ja, bundelkorting: 5% bij 2 producten, oplopend tot 20% bij 6. Je eerste bestelling wordt gratis verzonden.']].concat(NF.n ? [NF.faq[0]] : []);
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'WebSite', name: 'Kadoly gids', url: HOST + '/', publisher: { '@id': HOST + '/#org' }, inLanguage: 'nl-NL' }, { '@type': 'ItemList', name: 'Keuzehulpen van Kadoly', itemListElement: R.map((r, k) => ({ '@type': 'ListItem', position: k + 1, name: r.naam, url: HOST + '/rubriek/' + r.c })).concat(NF.n ? [{ '@type': 'ListItem', position: R.length + 1, name: 'Nieuw bij Kadoly', url: HOST + NIEUW_PAD }] : []) }, { '@type': 'FAQPage', mainEntity: faq.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }] }).replace(/</g, '\\u003c');
  const rij = R.map(r => `<div class="r"><dt><a href="/rubriek/${esc(r.c)}">${esc(r.naam)}</a></dt><dd>${r.n} producten, ${euro(r.min)} tot ${euro(r.max)} inclusief verzending. ${esc(Object.entries(r.subs).filter(([x]) => x !== 'overig').sort((a, b) => b[1].length - a[1].length).slice(0, 5).map(([x]) => naamS(x)).join(', '))}</dd></div>`).join('');
  return kop('Kadoly gids: keuzehulp voor alles van Kadoly', `Kies stap voor stap uit ${alle} producten van makers, met prijs inclusief verzending en bezorgdag van vandaag. Eerlijk, ook als niets past.`, '/', `<script type="application/ld+json">${ld}</script>${NW_CSS}`) +
    `<p class="kicker"><span class="live-dot"></span>Kadoly keuzehulp</p><h1>Eerlijk kiezen, ook als het antwoord niet kopen is</h1><p class="standfirst">Beantwoord een paar vragen en je krijgt de 3 producten die het best bij je passen, met wat het vandaag kost inclusief verzending en wanneer het in huis is. Past niets, dan zeggen we dat.</p>
${keuzeHulp(R, '', '_home')}
<section aria-labelledby="lijst"><h2 id="lijst">Verlanglijst, lootjes en gedicht</h2><ul>${W_PAGINAS.map(x => `<li><a href="${x.pad}">${esc(x.naam)}</a></li>`).join('')}</ul></section>
<p><a href="/alle-producten">Bekijk alle ${alle} beschikbare producten, per rubriek</a></p>
<p><a href="/onderzoek-en-bronnen">Wat onderzoek wel en niet zegt over ons aanbod</a></p>
<section aria-labelledby="koopchecks"><h2 id="koopchecks">Eerst controleren, dan kiezen</h2><p>Deze koopchecks helpen je om claims en ontbrekende gegevens te beoordelen. We zijn de verkoper en gebruiken externe bronnen; we hebben de producten niet zelf getest.</p><ul><li><a href="/onderzoek-vaas-verse-bloemen">Vaas voor verse bloemen: water, opening en schoonmaken</a></li><li><a href="/onderzoek-tafellamp-lumen">Tafellamp: genoeg leeslicht, accuduur en buitengebruik</a></li><li><a href="/onderzoek-bamboe-textiel-claims">Bamboe textiel: vezels en onderbouwing van claims</a></li></ul><p><a href="/onderzoek-en-bronnen">Alle acht koopchecks en hun bronnen</a></p></section>
<h2 id="rubrieken">Per rubriek</h2><dl class="rows">${rij}</dl>
${NF.n ? `<h2 id="nieuw">Nieuw bij Kadoly</h2><p>${NF.n} producten kwamen er de afgelopen ${NIEUW_DAGEN} dagen bij. Dit zijn de nieuwste; <a href="${NIEUW_PAD}">bekijk alles wat nieuw is, per rubriek</a>.</p><ul class="nwl">${NF.L.slice(0, 6).map(i => nieuwRij(i, '_home')).join('')}</ul>` : ''}
${GIDS_IDS.length ? `<h2 id="gidsen">Uitgebreide keuzehulpen</h2><ul>${GIDS_IDS.map(id => GIDSEN[id]).map(x => `<li><a href="/${esc(x.slug)}">${esc(x.h1)}</a></li>`).join('')}</ul>` : ''}
<h2 id="vragen">Vragen over Kadoly</h2>${faq.map(([v, a]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${esc(a)}</p></div></details>`).join('')}${baken('_home')}` + VOET(null, kans);
}

// 13 nov 2026 (Henkjan: verlanglijst voor alles, lootjes, cadeauzoeker; api/w.js): eigen pagina's op deze host, met de dag van de laatste echte inhoudswijziging
const W_PAGINAS = [{ pad: '/w', versie: 'w1', lm: '2026-11-13', naam: 'Verlanglijstje maken: één lijst voor alles, uit elke winkel' }, { pad: '/w/lootjes', versie: 'w1', lm: '2026-11-13', naam: 'Lootjes trekken online, met ieders verlanglijst' }, { pad: '/w/gedicht', versie: 'w1', lm: '2026-11-14', naam: 'Sinterklaasgedicht maken: gratis gedichtengenerator' }, { pad: '/w/zoek', versie: 'w1', lm: '2026-11-13', naam: 'Cadeauzoeker: cadeau-ideeën uit alle winkels' }];
async function sitemap() {
  const cat = await catalogus();
  const R = await rubrieken();
  const u = [{ loc: HOST + '/', lm: null, img: [] }, ...W_PAGINAS.map(x => ({ loc: HOST + x.pad, lm: x.lm, img: [] })), {loc: HOST + '/alle-producten', lm:null, img:[] }].concat(GIDS_IDS.map(id => ({ loc: HOST + '/' + id, lm: GIDSEN[id].bijgewerkt, img: GIDSEN[id].keuze.map(k => cat[k.pid]).filter(i => i && i.img && i.vr !== false).map(i => i.img) }))).concat(R.map(r => ({ loc: HOST + '/rubriek/' + r.c, lm: null, img: r.items.slice().sort(rang({}, 0)).filter(i => i.img).slice(0, 5).map(i => i.img) })));
  const NF = await nieuwFeiten(); if (NF.n) u.push({ loc: HOST + NIEUW_PAD, lm: null, img: NF.L.filter(i => i.img).slice(0, 20).map(i => i.img) }); // lastmod = dag van het nieuwste product (echte wijziging)
  u.push({ loc: HOST + '/onderzoek-en-bronnen', lm: ONDERZOEK_DAG, img: [] }, ...ONDERZOEK.map(p => ({ loc: HOST + '/onderzoek-' + p.id, lm: onderwerpDag(p), img: [] })));
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' + u.map(x => `<url><loc>${x.loc}</loc>${x.lm ? '<lastmod>' + x.lm + '</lastmod>' : ''}${x.img.map(i => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`).join('') + '</urlset>';
}
// alles wat AI moet kunnen citeren in platte tekst (llms-full.txt)
async function llmsVol() {
  const cat = await catalogus(); let t = '# Kadoly gids: volledige tekst\n\nVolledig bladeroverzicht: ' + HOST + '/alle-producten\n\nKeuzehulpen van Kadoly (kadoly.com, ADSFAIR B.V.), wat er nieuw is in de winkel en het hele aanbod per rubriek. Prijzen inclusief verzending en levertijden (in werkdagen) komen live uit de winkel. Bij elk product in een keuzehulp staat waarvoor het niet geschikt is.\n\n';
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; t += '## ' + g.h1 + '\n\n' + HOST + '/' + id + '\n\n' + g.kort + '\n\n### Onze keuze\n\n';
    for (const k of g.keuze) { const i = cat[k.pid]; if (!i || i.vr === false) continue; t += '- ' + k.label + ': ' + (k.naam || i.t) + ', ' + euro(thuis(i)) + ' inclusief verzending, https://kadoly.com/product/' + k.pid + '. ' + k.waarom + (k.beperking ? ' Let op: ' + k.beperking : '') + '\n'; }
    if (g.tabel && g.tabel.length) { t += '\n### ' + (g.tabelKop || 'Welke past bij jouw situatie?') + '\n\n'; for (const r of g.tabel) t += '- ' + r.situatie + ': ' + r.advies + '\n'; }
    { const A = alleVan(g.slug, g.keuze.map(k => k.pid), cat, {}, thuis); if (A && A.n) t += '\n### ' + A.def.kop + ' bij Kadoly\n\n' + A.totaal + ' producten van deze soort, van ' + euro(A.van) + ' tot ' + euro(A.tot) + ' inclusief verzending: ' + A.groepen.map(x => x.naam.toLowerCase() + ' (' + x.items.length + ')').join(', ') + '. Volledige lijst met prijs en bezorgdag: ' + HOST + '/' + g.slug + '#alle\n'; }
    for (const b of (g.uitleg || [])) t += '\n### ' + b.kop + '\n\n' + b.alineas.join('\n\n') + '\n';
    t += '\n### Zo kozen we\n\n' + g.zoKozenWe + '\n\n### Veelgestelde vragen\n\n' + (g.faq || []).map(f => '**' + f.v + '**\n' + f.a).join('\n\n') + '\n\n'; if(g.bronnen?.length)t+='### Bronnen en beperkingen\n\n'+g.bronnen.map(id=>{const b=BRONNEN[id];return '- '+b.titel+', '+b.organisatie+', '+b.datum+'. '+b.url+'. '+b.grens;}).join('\n')+'\n\n'; }
  const NF = await nieuwFeiten(); if (NF.n) t += '## Nieuw bij Kadoly (afgelopen ' + NIEUW_DAGEN + ' dagen)\n\n' + HOST + NIEUW_PAD + '\n\n' + NF.kort + '\n\n' + NF.groepen.map(([c, l]) => '- ' + naamR(c) + ': ' + l.length + ' nieuw, ' + HOST + NIEUW_PAD + '#n-' + c).join('\n') + '\n\nIn het aanbod hieronder staat bij elk nieuw product de dag waarop het in de winkel kwam.\n\n';
  const R = await rubrieken(); t += '## Het hele aanbod van Kadoly per rubriek\n\n'; // 4 nov: alles wat in de winkel staat, zodat AI-assistenten elk product kunnen noemen
  for (const r of R) { t += '### ' + r.naam + '\n\n' + HOST + '/rubriek/' + r.c + '\n\n'; for (const [sb, l] of Object.entries(r.subs).sort((a, b) => (a[0] === 'overig') - (b[0] === 'overig') || b[1].length - a[1].length)) t += '#### ' + naamS(sb) + '\n\n' + l.slice().sort((a, b) => N(b.sc) - N(a.sc)).map(i => llmRegel(i, true)).join('\n') + '\n\n'; }
  return t + onderzoekTekst(Object.values(cat));
}
// zicht.json: het manifest voor de ZICHT-lus (lib/zicht-projecten.js), met eigen meting van lezers en AI-bots
async function zichtJson() {
  const vragen = ['lootjes trekken online', 'sinterklaasgedicht maken', 'verlanglijstje maken', 'online verlanglijst met links uit elke winkel']; /* 13 nov: echte seizoensvragen eerst (les meetpanel-echte-vragen) */ for (const id of GIDS_IDS) { const g = GIDSEN[id]; vragen.push(g.h1.replace(/\?$/, '')); for (const f of (g.faq || [])) vragen.push(f.v); }
  const per = { google: 0, bing: 0, chatgpt: 0, perplexity: 0, copilot: 0, gemini: 0, claude: 0, duckduckgo: 0 }, bots = {};
  for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); try { const a = await kv.raw(['HGETALL', 'gk:d:' + d]); if (Array.isArray(a)) for (let j = 0; j + 1 < a.length; j += 2) { const f = a[j], n = N(a[j + 1]); const m = f.match(/\|v-([a-z]+)$/); if (m && per[m[1]] !== undefined) per[m[1]] += n; const b = f.match(/^_bot\|([a-z-]+)\|/); if (b) bots[b[1]] = N(bots[b[1]]) + n; } } catch (e) {} }
  const zoek = per.google + per.bing + per.duckduckgo, ai = per.chatgpt + per.perplexity + per.copilot + per.gemini + per.claude;
  return { zicht: 1, site: { vragen: vragen.slice(0, 30), merk: ['Kadoly', 'kadoly.com', 'gids.kadoly.com', 'Kadoly gids'], taal: 'nl', land: 'NL', repo: 'henkjandekrijger-glitch/hjdk-api' }, toegepast: [{ les: 'antwoord-bovenaan', dag: '2026-10-30', wat: 'kort antwoord bovenaan elke gids' }, { les: 'titel-zoekterm-voorop', dag: '2026-11-13', wat: 'verlanglijst-, lootjes-, gedicht- en cadeauzoekerpagina (/w): zoekterm voorop in de titel per taal' }, { les: 'faq-uit-zoekvragen', dag: '2026-11-13', wat: '/w-paginas: vijf echte vragen met antwoord als gewone HTML, FAQPage alleen in het Nederlands waar de tekst zichtbaar is' }, { les: 'vary-bij-taalkeuze', dag: '2026-11-13', wat: '/w kiest de taal zelf: Vary Accept-Language en Cookie; Nederlands op het kale adres als x-default, andere talen met ?taal= en hreflang' }, { les: 'ssr-gids-inhoud', dag: '2026-10-30', wat: 'alle inhoud in de HTML, ook de check' }, { les: 'beelden-vindbaar', dag: '2026-10-30', wat: 'image:image in de sitemap' }], nvt: [], proeven: [{ id: 'kadoly-bronadvies-index-1104', les: 'ssr-gids-inhoud', metric: 'index', na: 21, urls: ONDERZOEK.map(p => HOST + '/onderzoek-' + p.id), controle: [], wat: 'Acht brononderwerpen met live aanbod. Observationele indexmeting, geen causale effectclaim.' }, { id: 'kadoly-bronadvies-gsc-1104', les: 'antwoord-bovenaan', metric: 'gsc', na: 35, urls: ONDERZOEK.map(p => HOST + '/onderzoek-' + p.id), controle: [], wat: 'Bereik van nieuwe brononderwerpen. Nieuwe paginas, geen vergelijkbare nulmeting: groei alleen beschrijven, geen bewezen optimalisatiewinst.' }], lessen: [], meting: { bezoek7d: { zoek, ai, perBron: per }, aiBots7d: bots } };
}
async function llms() {
  const cat = await catalogus();
  let t = '# Kadoly gids\n\n> Keuzehulpen van Kadoly (kadoly.com), een Nederlandse webshop met producten van makers. Per gids: korte keuze, prijs inclusief verzending en levertijd van vandaag, waarvoor een product niet geschikt is, en antwoorden op veelgestelde vragen.\n\n';
  t += '## Volledig aanbod\n\n' + HOST + '/alle-producten\nAlle beschikbare producten per rubriek, ook buiten Nieuw.\n\n';
  t += '## Gratis hulpmiddelen\n\n' + W_PAGINAS.map(x => '- ' + x.naam + ': ' + HOST + x.pad).join('\n') + '\nVerlanglijst zonder account met links uit elke winkel (gevers vinken stiekem af), lootjes trekken met uitzonderingen en een anonieme roddelbox, een Sinterklaasgedicht op maat en een cadeauzoeker over alle winkels. In vijf talen (nl, en, de, fr, es).\n\n';
  const R = await rubrieken(); t += '## Rubrieken\n\n' + R.map(r => '- ' + r.naam + ': ' + r.n + ' producten van ' + r.merken.size + ' makers, ' + euro(r.min) + ' tot ' + euro(r.max) + ' inclusief verzending, ' + HOST + '/rubriek/' + r.c).join('\n') + '\n\n';
  const NF = await nieuwFeiten(); if (NF.n) t += '## Nieuw bij Kadoly\n\n' + HOST + NIEUW_PAD + '\n\n' + NF.kort + ' De volledige lijst staat in ' + HOST + '/llms-full.txt.\n\n' + NF.L.slice(0, 20).map(i => llmRegel(i, true)).join('\n') + '\n\n';
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; t += '## ' + g.h1 + '\n\n' + HOST + '/' + id + '\n\n' + g.kort + '\n\n'; for (const k of g.keuze) { const i = cat[k.pid]; if (!i || i.vr === false) continue; t += '- ' + k.label + ': ' + (k.naam || i.t) + ', ' + euro(thuis(i)) + ' inclusief verzending. ' + k.waarom + (k.beperking ? ' Let op: ' + k.beperking : '') + '\n'; } t += '\n'; }
  return t + onderzoekTekst(Object.values(cat));
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

// aanmelding voor de Kadoly-mail en meldingen (lib/kadoly-nieuws.js): /nieuws, /nieuws/bevestig, /nieuws/af, /nieuws/push, /nieuws/bericht, /nieuws/klik, /kadoly-sw.js
const beschermdHost = h => /\.vercel\.app$/i.test(h);
let MAILK = false, MAILK_AT = 0, NBI = {}; // staat het mailformulier aan (verzenddomein geverifieerd bij Resend)?
const kaal = (titel, inhoud, script) => kop(titel + ' | Kadoly', titel, '/nieuws', '<meta name="robots" content="noindex">') + inhoud + '</main>' + VOETBALK + (script || '') + '</body></html>';
const gidsLijst = () => '<h2>Alvast lezen</h2><ul class="toc">' + NB.gidsenNieuw().slice(0, 5).map(g => `<li><a href="/${esc(g.slug)}">${esc(g.h1)}</a></li>`).join('') + '</ul>';
async function winOpties() { // prijzen voor de winnaar: elk product uit een keuzehulp dat in de winkel staat, tot de prijsgrens incl. verzending
  const cat = await catalogus(), max = await NB.prijsMax(), uit = [], gezien = new Set();
  for (const id of GIDS_IDS) { const g = GIDSEN[id]; for (const c of (g.keuze || [])) { const i = cat[c.pid]; if (!i || gezien.has(c.pid)) continue; const pr = thuis(i); if (!(pr > 0 && pr <= max)) continue; gezien.add(c.pid); uit.push({ pid: c.pid, naam: c.naam || i.t, prijs: pr, img: i.img, gids: String(g.h1 || '').split(':')[0] }); } }
  return uit.sort((a, b) => b.prijs - a.prijs);
}
async function nieuwsOp(op, req, res, q, host, ua) {
  res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
  const html = (code, titel, inhoud, script) => { res.setHeader('content-type', 'text/html; charset=utf-8'); return res.status(code).send(kaal(titel, inhoud, script)); };
  const vanHier = () => { const o = req.headers.origin; if (!o) return true; try { const hh = new URL(o).hostname; return hh === 'gids.kadoly.com' || /\.vercel\.app$/i.test(hh); } catch (e) { return false; } };
  const waar = b => String((b && b.waar) || '').replace(/[^a-z0-9-]/g, '').slice(0, 40);
  const ongeldig = () => html(400, 'Deze link werkt niet meer', `<p class="kicker">Kadoly-nieuws</p><h1>Deze link werkt niet meer</h1><p>Een bevestigingslink is twee dagen geldig. Meld je gerust opnieuw aan, dan sturen we meteen een nieuwe.</p>${NB.blok('_home', { mail: MAILK, info: NBI })}`, NB.NB_SCRIPT);
  if (op === 'nbsw') { res.setHeader('content-type', 'application/javascript; charset=utf-8'); res.setHeader('service-worker-allowed', '/'); return res.status(200).send(NB.SW); }
  if (op === 'nbklik') { res.setHeader('location', await NB.klik(q)); return res.status(302).end(); }
  if (op === 'nbronde') { // elke dag (cron 17:47 UTC): meldingen; op vrijdag de mail. Handmatig alleen via de beschermde host (?droog=1, ?test=<adres>, ?mailnu=1)
    const cron = (process.env.CRON_SECRET && req.headers.authorization === 'Bearer ' + process.env.CRON_SECRET) || /vercel-cron/i.test(String(ua)); if (!cron && !beschermdHost(host)) return res.status(404).send('Niet gevonden');
    const test = beschermdHost(host) ? String(q.get('test') || '').trim().toLowerCase() : '';
    return res.status(200).json(await NB.ronde({ droog: q.get('droog') === '1', test: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test) ? test : '', mailNu: beschermdHost(host) && q.get('mailnu') === '1' })); }
  if (op === 'nbnieuws') { if (!beschermdHost(host)) return res.status(404).send('Niet gevonden'); return res.status(200).json(await NB.nieuwsZet(q)); }
  if (op === 'nbstand') return res.status(200).json(await NB.stand(beschermdHost(host)));
  if (op === 'nbdomeinweg') { if (!beschermdHost(host) || q.get('zeker') !== '1') return res.status(404).send('Niet gevonden'); return res.status(200).json(await NB.domeinWeg(q.get('naam'), { ookGeverifieerd: q.get('geverifieerd') === '1' })); } // 6 nov: plek maken bij Resend, alleen op Henkjans woord
  if (op === 'nbdomein') { if (!beschermdHost(host)) return res.status(404).send('Niet gevonden'); const d = await NB.domein(q.get('maak') === '1'); MAILK_AT = 0; return res.status(200).json(d); }
  if (op === 'nbbericht') return res.status(200).json(await NB.bericht(await leesBody(req)));
  if (op === 'nbpush') { if (req.method !== 'POST') return res.status(200).json({ vapid: await NB.vapidPub() }); if (!vanHier() || isBot(ua)) return res.status(403).json({ ok: false }); const b = await leesBody(req); return res.status(200).json(await NB.pushAan({ ...b, waar: waar(b) })); }
  if (op === 'nbregels') return html(200, 'Spelregels winactie', NB.SPELREGELS(await NB.prijsMax()));
  if (op === 'nbwinnaars') { const T = await NB.trekkingen(); const regel = x => { const d = new Date(x.at).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); const wie = x.status === 'gekozen' ? (x.naam ? esc(x.naam) + ' koos de ' + esc(x.product) : 'Een winnaar die anoniem blijft koos de ' + esc(x.product)) : x.status === 'verlopen' ? 'De winnaar koos niet binnen 14 dagen; de prijs is vervallen.' : 'De winnaar kiest nog.'; return `<div class="r"><dt>${esc(d)}</dt><dd>${wie}<br>${x.deelnemers} ${x.deelnemers === 1 ? 'deelnemer' : 'deelnemers'} · lot uit ${esc(x.bron)}${x.ronde ? ' (ronde ' + esc(x.ronde) + ')' : ''}${x.reactie ? '<br>Reactie: “' + esc(x.reactie) + '”' : ''}</dd></div>`; };
    return html(200, 'Alle trekkingen', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Alle trekkingen</h1><p>Elke vrijdag loten we onder alle aanmelders één winnaar. Hier staat elke trekking, met het aantal deelnemers en de ronde van de openbare toevalsgenerator drand. Namen alleen met toestemming.</p>${T.length ? '<dl class="rows">' + T.map(regel).join('') + '</dl>' : '<p><b>Nog geen trekkingen.</b> De eerste is op ' + esc(NBI.eerste || 'de eerste vrijdag met aanmelders') + '.</p>'}<p><a href="/nieuws/spelregels">Spelregels</a></p>${NB.blok('_home', { mail: MAILK, info: NBI })}`, NB.NB_SCRIPT); }
  if (op === 'nbwin') { const t = String(q.get('t') || ''); const w = await NB.winnaarLees(t); const S = '<style>.wo{display:grid;gap:10px;margin:0 0 22px}.wo label{display:flex;gap:12px;align-items:center;border:1px solid var(--line-strong);border-radius:14px;padding:10px 12px;cursor:pointer}.wo label:has(input:checked){border-color:var(--acc);box-shadow:0 0 0 2px var(--acc2)}.wo input{accent-color:#1D9BF0;width:20px;height:20px;flex:none}.wo img{width:56px;height:56px;border-radius:10px;object-fit:cover;flex:none}.wo b{display:block}.wf{display:grid;gap:10px;max-width:560px}.wf input[type=text],.wf textarea{min-height:48px;border:1px solid var(--line-strong);border-radius:12px;padding:10px 12px;font:inherit;font-size:17px;background:var(--bg);color:var(--ink)}.wf .twee{display:grid;grid-template-columns:1fr 1fr;gap:10px}.wf label.vk{display:flex;gap:10px;align-items:flex-start;font-size:16px}.wf label.vk input{width:20px;height:20px;accent-color:#1D9BF0;flex:none;margin-top:2px}</style>';
    if (!w) return html(400, 'Deze link werkt niet', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Deze link werkt niet</h1><p>Mail ons op <a href="mailto:henkjan@yoo.rs">henkjan@yoo.rs</a>, dan zoeken we het samen uit.</p>`);
    const reactie = q.get('reactie') === '1';
    if (req.method === 'POST') { const b = await leesBody(req);
      if (reactie) { const r = await NB.winnaarReactie(t, b); if (r.fout) return html(400, 'Dat lukte niet', `<h1>Dat lukte niet</h1><p>Schrijf minstens een paar woorden. <a href="/nieuws/winnaar?t=${esc(t)}&amp;reactie=1">Probeer het opnieuw</a>.</p>`); return html(200, 'Dank je wel', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Dank je wel</h1><p>Je reactie is binnen${r.w.reactie.toestemming ? ' en komt met je voornaam in de volgende mail' : '. We plaatsen hem niet, want je gaf geen toestemming'}.</p><p><a href="/">Naar de keuzehulpen</a></p>`); }
      const opties = await winOpties(); const r = await NB.winnaarKies(t, b, opties);
      if (r.fout) return html(400, 'Nog niet compleet', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>${r.fout === 'verlopen' ? 'Deze prijs is verlopen' : r.fout === 'gekozen' ? 'Je hebt al gekozen' : 'Nog niet compleet'}</h1><p>${r.fout === 'product' ? 'Kies een product uit de lijst.' : r.fout === 'adres' ? 'Vul je naam, adres, postcode (zoals 2805 AB) en plaats in.' : 'Mail ons op <a href="mailto:henkjan@yoo.rs">henkjan@yoo.rs</a> als er iets niet klopt.'}</p><p><a href="/nieuws/winnaar?t=${esc(t)}">Terug</a></p>`);
      return html(200, 'Je prijs is onderweg', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Top, je prijs komt eraan</h1><p>Je koos de <b>${esc(r.w.keuze.naam)}</b>. We bestellen hem voor je en hij wordt gratis bij je thuisbezorgd. Je adres gebruiken we alleen hiervoor en we wissen het binnen 60 dagen.</p><p><a href="/">Naar de keuzehulpen</a></p>`); }
    if (w.status === 'verlopen') return html(200, 'Deze prijs is verlopen', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Deze prijs is verlopen</h1><p>Je had 14 dagen om te kiezen. Je doet wel gewoon weer mee met de volgende trekkingen.</p>`);
    if (w.status === 'gekozen') { if (reactie && !w.reactie) return html(200, 'Hoe bevalt het?', S + `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Hoe bevalt je ${esc(w.keuze.naam)}?</h1><p>Eén zin is genoeg. Eerlijk, ook als het tegenvalt.</p><form class="wf" method="post" action="/nieuws/winnaar?t=${esc(t)}&amp;reactie=1"><textarea name="tekst" maxlength="300" rows="3" required aria-label="Je reactie"></textarea><label class="vk"><input type="checkbox" name="toestemming" value="1" checked><span>Je mag mijn reactie met mijn voornaam${w.plaats ? ' en woonplaats' : ''} in de mail en bij Alle trekkingen zetten.</span></label><button class="btn knop" type="submit">Stuur mijn reactie</button></form>`);
      return html(200, 'Je keuze is binnen', `<p class="kicker">Kadoly-nieuws · winactie</p><h1>${w.reactie ? 'Dank je voor je reactie' : 'Je keuze is binnen'}</h1><p>Je koos de <b>${esc(w.keuze.naam)}</b>. ${w.reactie ? 'Je reactie hebben we ook.' : 'We sturen hem zo snel mogelijk naar je toe.'}</p><p><a href="/">Naar de keuzehulpen</a></p>`); }
    const max = await NB.prijsMax(); const opties = await winOpties();
    return html(200, 'Kies je prijs', S + `<p class="kicker">Kadoly-nieuws · winactie</p><h1>Gefeliciteerd, kies je prijs</h1><p>Je bent getrokken uit ${w.deelnemers} ${w.deelnemers === 1 ? 'aanmelder' : 'aanmelders'}. Kies één product tot €${max}, dan bestellen wij hem en wordt hij gratis bij je thuisbezorgd. Je betaalt niets en we vragen nooit om bankgegevens.</p>
<form class="wf" method="post" action="/nieuws/winnaar?t=${esc(t)}"><div class="wo" role="radiogroup" aria-label="Kies je product">${opties.map((o, i) => `<label><input type="radio" name="pid" value="${esc(o.pid)}"${i === 0 ? ' required' : ''}>${o.img ? `<img src="${esc(o.img)}" alt="" loading="lazy" width="56" height="56">` : ''}<span><b>${esc(o.naam)}</b>uit de keuzehulp ${esc(o.gids)} · waarde ${euro(o.prijs)}</span></label>`).join('')}</div>
<input type="text" name="voornaam" autocomplete="given-name" placeholder="Voornaam" required aria-label="Voornaam"><input type="text" name="achternaam" autocomplete="family-name" placeholder="Achternaam" required aria-label="Achternaam"><input type="text" name="adres" autocomplete="street-address" placeholder="Straat en huisnummer" required aria-label="Straat en huisnummer"><div class="twee"><input type="text" name="postcode" autocomplete="postal-code" placeholder="Postcode" required aria-label="Postcode" maxlength="7"><input type="text" name="plaats" autocomplete="address-level2" placeholder="Plaats" required aria-label="Plaats"></div>
<label class="vk"><input type="checkbox" name="toestemming" value="1"><span>Je mag mijn voornaam en woonplaats noemen in de mail van Kadoly en bij Alle trekkingen.</span></label><button class="btn knop" type="submit">Stuur mijn prijs</button><p class="meta">Je hebt tot ${esc(new Date(w.at + 14 * 864e5).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'long' }))} om te kiezen. <a href="/nieuws/spelregels">Spelregels</a></p></form>`); }
  if (op === 'nieuws' && req.method !== 'POST') { // voorbeeldmail: precies wat een abonnee krijgt
    const mail = NB.mailWeek(NB.gidsenNieuw().slice(0, 3), (await NB.nieuwsItems()).slice(-2).reverse(), '#', k => HOST + '/' + (GIDSEN[k] ? k : '')).replace('<head>', '<head><base target="_top">');
    return html(200, 'Voorbeeld van de Kadoly-mail', `<p class="kicker">Kadoly-nieuws</p><h1>Zo ziet de mail eruit</h1><p>Dit is precies wat je krijgt: op vrijdag de nieuwe keuzehulpen en het nieuws van Kadoly, hooguit één mail per week. Is er niets nieuws, dan sturen we niets.</p><iframe title="Voorbeeldmail van Kadoly" srcdoc="${esc(mail)}" style="width:100%;height:1150px;border:1px solid var(--line);border-radius:18px;background:#E8F4FD" loading="lazy"></iframe>${NB.blok('_home', { mail: MAILK, info: NBI })}`, NB.NB_SCRIPT); }
  if (op === 'nieuws') { if (!vanHier() || isBot(ua)) return res.status(403).json({ ok: false }); const b = await leesBody(req); const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '').split(',')[0].trim();
    try { const r = await NB.aanmelden({ ...b, waar: waar(b) }, ip); return res.status(r.ok ? 200 : r.fout === 'druk' ? 429 : 400).json(r); } catch (e) { console.error('nieuws aanmelden', String(e && e.message || e).slice(0, 160)); return res.status(503).json({ ok: false, fout: 'mail' }); } }
  if (op === 'nbbevestig') { const t = String(q.get('t') || '');
    if (req.method === 'POST') { const s = await NB.bevestig(t); if (!s) return ongeldig();
      return html(200, 'Je bent aangemeld', `<p class="kicker">Kadoly-nieuws</p><h1>${s.al ? 'Je was al aangemeld' : 'Gelukt, je bent aangemeld'}</h1><p>Vanaf nu krijg je op vrijdag de nieuwe keuzehulpen en het nieuws van Kadoly op <b>${esc(s.email)}</b>. Hooguit één mail per week, en afmelden kan met één klik onderaan elke mail.</p>${NB.blok('_home', { alleenPush: true })}${gidsLijst()}`, NB.NB_SCRIPT); }
    const p = await NB.bevestigOpen(t); if (!p) return ongeldig();
    if (p.klaar) return html(200, 'Je bent al aangemeld', `<p class="kicker">Kadoly-nieuws</p><h1>Je bent al aangemeld</h1><p>Je krijgt op vrijdag de nieuwe keuzehulpen op <b>${esc(p.email)}</b>.</p>${gidsLijst()}`);
    return html(200, 'Bevestig je aanmelding', `<p class="kicker">Kadoly-nieuws</p><h1>Nog één klik</h1><p>Bevestig dat je de nieuwe keuzehulpen en het nieuws van Kadoly wilt ontvangen op <b>${esc(p.email)}</b>.</p><form method="post" action="/nieuws/bevestig?t=${esc(t)}" id="nbb"><button class="btn knop" type="submit">Ja, meld me aan</button></form><p class="meta">Hooguit één mail per week · afmelden met één klik</p>`, '<script>setTimeout(function(){if(document.visibilityState==="visible"){var f=document.getElementById("nbb");f.querySelector("button").disabled=true;f.submit()}},400)</script>'); }
  if (op === 'nbaf') { const t = String(q.get('t') || ''), weer = q.get('weer') === '1';
    if (req.method === 'POST' && !weer) { await NB.afmelden(t); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('Afgemeld'); } // één klik vanuit de mailapp (List-Unsubscribe-Post)
    const terug = req.method === 'POST' && weer; const s = await NB.afmelden(t, terug);
    if (!s) return html(400, 'Deze afmeldlink werkt niet', `<p class="kicker">Kadoly-nieuws</p><h1>Deze afmeldlink werkt niet</h1><p>Mail ons op <a href="mailto:henkjan@yoo.rs">henkjan@yoo.rs</a>, dan melden we je met de hand af. Dat doen we dezelfde dag.</p>`);
    if (terug) return html(200, 'Je bent weer aangemeld', `<p class="kicker">Kadoly-nieuws</p><h1>Je bent weer aangemeld</h1><p>Fijn dat je blijft. Je krijgt weer hooguit één mail per week op <b>${esc(s.email)}</b>.</p><p><a href="/">Naar de keuzehulpen</a></p>`);
    return html(200, 'Je bent afgemeld', `<p class="kicker">Kadoly-nieuws</p><h1>Je bent afgemeld</h1><p><b>${esc(s.email)}</b> krijgt geen mail meer van ons. Eén klik was genoeg, en zo blijft het.</p><form method="post" action="/nieuws/af?t=${esc(t)}&amp;weer=1"><button class="btn deel" type="submit">Per ongeluk? Meld me weer aan</button></form><p><a href="/">Naar de keuzehulpen</a></p>`); }
  return res.status(404).send('Niet gevonden');
}

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://gids.kadoly.com'); const q = url.searchParams; const op = q.get('op') || ''; const ua = req.headers['user-agent'] || '';
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(':')[0];
  if (Date.now() - MAILK_AT > 300000) { MAILK_AT = Date.now(); MAILK = await NB.mailKlaar(); try { NBI = await NB.blokInfo(); } catch (e) {} }
  if (Date.now() - META_AT > 300000) { META_AT = Date.now(); try { META = String((await kv.get('gk:gscmeta')) || ''); } catch (e) {} }
  try {
    if (/^(nieuws|nbbevestig|nbaf|nbpush|nbbericht|nbklik|nbsw|nbronde|nbnieuws|nbstand|nbdomein|nbdomeinweg|nbwin|nbregels|nbwinnaars)$/.test(op)) return await nieuwsOp(op, req, res, q, host, ua);
    if (op === 'paginacheck') { if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden'); // nakijken zonder de hele pagina op te halen: maat, titel, kop, schema, rijen (beschermde host)
      const kans = await armKans(), R = await rubrieken(); const pag = { home: await home(kans), nieuw: await nieuwPagina(kans), ['rubriek-' + R[0].c]: await rubriekPagina(R[0].c, kans) }; const uit = {};
      for (const [k, h] of Object.entries(pag)) { const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => { try { const j = JSON.parse(m[1]); return (j['@graph'] || [j]).map(x => x['@type'] + (x.itemListElement ? ':' + x.itemListElement.length : x.mainEntity ? ':' + x.mainEntity.length : '')).join(','); } catch (e) { return 'FOUT ' + String(e.message).slice(0, 60); } });
        uit[k] = { kb: Math.round(h.length / 1024), titel: (h.match(/<title>([^<]*)/) || [])[1], titelTekens: ((h.match(/<title>([^<]*)/) || [])[1] || '').length, besch: ((h.match(/name="description" content="([^"]*)/) || [])[1] || '').length, h1: (h.match(/<h1>([^<]*)/) || [])[1], h2: (h.match(/<h2/g) || []).length, h3: (h.match(/<h3/g) || []).length, rijen: (h.match(/class="nw-a"/g) || []).length, schema: lds, streep: /\u2014/.test(h.replace(/<script[\s\S]*?<\/script>/g, '')), kort: ((h.match(/<strong>In het kort\.<\/strong> ([^<]*)/) || [])[1] || '').slice(0, 400) }; }
      const lt = await llms(), lv = await llmsVol(), sm = await sitemap();
      return res.status(200).json({ ok: true, paginas: uit, llms: { kb: Math.round(lt.length / 1024), nieuwBlok: lt.includes('## Nieuw bij Kadoly') }, llmsFull: { kb: Math.round(lv.length / 1024), regels: lv.split('\n').filter(x => x.startsWith('- ')).length, kopjes: (lv.match(/^#{2,4} /gm) || []).length }, sitemap: { urls: (sm.match(/<url>/g) || []).length, nieuw: sm.includes(NIEUW_PAD) ? (sm.match(new RegExp(NIEUW_PAD + '</loc><lastmod>([^<]*)')) || [])[1] : null } }); }
    if (op === 'nieuwstand') { if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden'); // wat er nieuw is in de catalogus (alleen lezen, beschermde host)
      const cat = Object.values(await catalogus()); const perDag = {}; for (const i of cat) if (N(i.l)) { const d = dagVan(i.l); perDag[d] = (perDag[d] || 0) + 1; } const F = await nieuwFeiten();
      return res.status(200).json({ ok: true, catalogus: cat.length, metDatum: cat.filter(i => N(i.l)).length, perDag: Object.fromEntries(Object.entries(perDag).sort().slice(-45)), nieuw: F.n, makers: F.merk.size, perRubriek: F.groepen.map(([c, l]) => [c, l.length]), engelsTitel: F.L.filter(i => / (by|for|with|and|the|of|set|black|white|grey|gray|brown|light|blue|green|gold|large|small|indoor|outdoor|wooden|round) /i.test(' ' + i.t + ' ') && !/ (voor|met|van|en|de|het|op|uit|om|in|zwart|wit|grijs|bruin|groen|goud|houten|ronde|set van) /i.test(' ' + i.t + ' ')).length, verlichtingZonderLicht: F.L.filter(i => sleutel(i.s) === 'verlichting' && !/lamp|licht|led|lantaarn|lantern|lamp|light(?! (blue|brown|grey|gray|green|pink|beige))|kaars|candle/i.test(i.t)).map(i => i.t).slice(0, 12), kort: F.kort, voorbeeld: F.L.slice(0, 12).map(i => [i.id, i.t, i.c, i.s, i.b, dagVan(i.l)]) }); }
    if (op === 'ixkey') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(INDEXNOW_KEY); }
    if (op === 'llmsfull') { await telBot(ua, 'llmsfull'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llmsVol()); }
    if (op === 'zicht') { res.setHeader('content-type', 'application/json; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=3600'); return res.status(200).json(await zichtJson()); }
    if (op === 'groei') {
      if (!/\.vercel\.app$/i.test(host)) return res.status(404).send('Niet gevonden');
      const stand = await groeiStand(kv, Object.values(await catalogus()));
      res.setHeader('cache-control', 'no-store');
      if (q.get('f') === 'json') return res.status(200).json(stand);
      return res.status(200).send(kop('Organische groei | Kadoly gids', 'Beheer van metingen en inhoud.', '/', '<meta name="robots" content="noindex,nofollow">') + groeiHtml(stand) + '</main></body></html>');
    }
    if (op === 'vraagkansen') { // Henkjan 10 nov 2026: onderwerpen die ChatGPT naar boven haalt en die in de winkel komen. Zoekvraag (Demand Radar) naast aanbod en gidsen. Cron 00:20 UTC met vers=1.
      const { vraagKansen } = await import('../lib/kadoly-vraag.js');
      const r = await vraagKansen({ vers: q.get('vers') === '1', catItems: Object.values(await catalogus()) });
      res.setHeader('cache-control', 'no-store'); res.setHeader('x-robots-tag', 'noindex');
      if (q.get('kort') === '1' && r.ok) return res.status(200).json({ ...r, kansen: r.kansen.slice(0, 15).map(x => ({ id: x.id, naam: x.naam, actie: x.actie, zoekenPerMaand: x.zoekenPerMaand, piekmaand: x.piekmaand, aanbod: x.aanbod, gidsen: x.gidsen, vragen: x.vragen.slice(0, 4).map(v => v.k + ' (' + v.perMaand + ')') })), weinig: undefined });
      return res.status(200).json(r);
    }
    if (op === 'onderzoekstand') { const m = await kv.get('gk:groei:laatste').catch(() => null); res.setHeader('cache-control', 'no-store'); return res.status(200).json({ ok: true, ...dekking(Object.values(await catalogus())), meetbaarheid: { dag: m?.dag || null, google: m?.google?.status || 'nog-niet-gemeten', googleDagen: m?.google?.dagen?.length || 0, googleBlokkade: m?.google?.reden || null, ai: m?.ai?.status || 'nog-niet-gemeten', aiGeslaagd: m?.ai?.geslaagd || 0, aiBlokkade: m?.ai?.fouten?.[0] || null } }); }
    if (op === 'indexnow') { // dagelijks: groeimeting zonder betaalde AI-aanroepen, daarna gewijzigde URLs aanmelden
      const items = Object.values(await catalogus());
      await groeiRonde(kv, items, req.headers['x-vercel-oidc-token'] || process.env.VERCEL_OIDC_TOKEN).catch(e => console.error('gids-groeimeting', String(e.message).slice(0,120)));
      const RR = await rubrieken(); const NF = await nieuwFeiten();
      let oud = null; try { oud = await kv.get('gk:indexnow'); } catch (e) {}
      const plan = gidsIndexPlan({ host:HOST, items, gidsen:GIDS_IDS.map(id => GIDSEN[id]), onderzoek:ONDERZOEK, bronnen:BRONNEN, nieuw:NF.L, rubrieken:RR, vorig:oud, extra:W_PAGINAS, versies:{home:'koopchecks-1107-w',checks:'vaas,lumen,bamboe',catalogus:'1',rubrieken:'1',nieuw:'1',gidsen:'2-alle',onderzoek:ONDERZOEK_DAG} });
      const urls = q.get('alles') === '1' ? [...new Set([...Object.keys(plan.paginas), ...plan.urls])] : plan.urls;
      if (!urls.length) return res.status(200).json({ ok:true, niets:true, gewijzigd:0 });
      let status = 0; try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'gids.kadoly.com', key: INDEXNOW_KEY, keyLocation: HOST + '/' + INDEXNOW_KEY + '.txt', urlList: urls }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) {}
      if (status >= 200 && status < 300) { try { await kv.set('gk:indexnow', { ...oud, at:Date.now(), paginas:plan.paginas, versie:2 }); } catch (e) {} }
      return res.status(200).json({ ok:status >= 200 && status < 300, status, gemeld:urls.length, gewijzigd:plan.gewijzigd, verwijderd:plan.verwijderd }); }
    if (op === 'robots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /naar/\n\n# Voor AI-assistenten: ' + HOST + '/llms.txt en ' + HOST + '/llms-full.txt\nSitemap: ' + HOST + '/sitemap.xml\n'); }
    if (op === 'sitemap') { await telBot(ua, 'sitemap'); res.setHeader('content-type', 'application/xml; charset=utf-8'); return res.status(200).send(await sitemap()); }
    if (op === 'llms') { await telBot(ua, 'llms'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llms()); }
    if (op === 'tel') { const g = String(q.get('g') || ''); const s = String(q.get('s') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30); if ((GIDSEN[g] || ONDERZOEK.some(p => 'onderzoek-' + p.id === g) || g === 'onderzoek-en-bronnen' || g === '_home' || g === '_zoek' || g === '_nieuw' || g === 'catalogus' || /^r-[a-z0-9-]{2,30}$/.test(g)) && s && !isBot(ua)) { await tel(g, s); if (/^v-/.test(s) && (GIDSEN[g] || /^r-/.test(g) || g === '_home')) { try { await kv.raw(['HINCRBY', 'gk:p:' + (g === '_home' ? 'home' : g), '_v', '1']); await kv.raw(['EXPIRE', 'gk:p:' + (g === '_home' ? 'home' : g), String(120 * 86400)]); } catch (e) {} } } return res.status(204).end(); }
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
      return res.status(200).json({ ok: true, gidsen: GIDS_IDS, perDag: uit, kliksPerProduct: geleerdPer, armproef: { kansAfrekenen: await armKans(), stand28d: await armStand(28) }, zoeken: { vragen: rij(/^(?!0\||o\||k\|)/), keuzes: rij(/^k\|/), zonderUitkomst: rij(/^0\|/), chatOnderwerpen: rij(/^o\|/) }, chatLaatste: chat, nieuws: await NB.stand(false).catch(() => null) }); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    const slug = String(q.get('slug') || '');
    const rub = String(q.get('rubriek') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30);
    if (rub) { const html = await rubriekPagina(rub, await armKans()); if (!html) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze rubriek bestaat niet.', '/', '') + '<h1>Deze rubriek bestaat niet</h1><p><a href="/#rubrieken">Naar alle rubrieken</a></p>' + VOET(null, 0.5)); } await telBot(ua, 'r-' + rub); return res.status(200).send(html); }
    if (!slug) { await telBot(ua, '_home'); return res.status(200).send(await home(await armKans())); }
    if (slug === 'onderzoek-en-bronnen' || ONDERZOEK.some(p => slug === 'onderzoek-' + p.id)) {
      const items = Object.values(await catalogus()); const p = ONDERZOEK.find(p => slug === 'onderzoek-' + p.id);
      const title = p ? p.titel : 'Onderzoek en bronnen: zo kiest Kadoly';
      const body = p ? onderzoekPagina(p, items, i => euro(thuis(i)), lt => nlDatum(leverDatum(lt))) : onderzoekHub(items);
      const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': p ? 'Article' : 'CollectionPage', headline: title, name: title, url: HOST + '/' + slug, inLanguage: 'nl-NL', dateModified: p ? onderwerpDag(p) : ONDERZOEK_DAG, author: { '@type': 'Organization', name: 'Kadoly redactie', url: HOST + '/onderzoek-en-bronnen' }, publisher: ORG }).replace(/</g, '\\u003c');
      await telBot(ua, slug);
      return res.status(200).send(kop(title, p ? p.kort : 'Bronnen, beperkingen en koopchecks. Wij zijn de verkoper en laten zien wat wel en niet onderzocht is.', '/' + slug, '<script type="application/ld+json">' + ld + '</script>') + body + baken(slug) + VOET(null, await armKans()));
    }
    if (slug === 'alle-producten') { await telBot(ua, '_catalogus'); return res.status(200).send(await alleProducten(await armKans())); }
    if (slug === NIEUW_PAD.slice(1)) { await telBot(ua, 'nieuw'); return res.status(200).send(await nieuwPagina(await armKans())); }
    const g = GIDSEN[slug]; if (!g) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze gids bestaat niet.', '/', '') + '<h1>Deze gids bestaat (nog) niet</h1><p><a href="/">Naar alle gidsen</a></p>' + VOET(null, 0.5)); }
    await telBot(ua, slug);
    return res.status(200).send(await gidsPagina(g));
  } catch (e) { res.setHeader('cache-control', 'no-store'); return res.status(500).send('Er ging iets mis: ' + esc(String(e && e.message || e).slice(0, 120))); }
}





