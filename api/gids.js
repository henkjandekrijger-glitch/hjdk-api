// gids.kadoly.com: keuzehulpen van Kadoly zelf, voor zoekers in Google en AI-assistenten (Henkjan 30 okt 2026: "We gaan Kadoly.help maken
// en daar keuzehulpen maken voor alle content van Kadoly ... de long game om te verkopen via SEO en LLM ... Dit is ons LAB ook voor Kadoly";
// op de vraag waar: "gids.kadoly.com"). Plan en werkwijze: OVERDRACHT-KADOLY-GIDS.md.
// Regels: eerst de lijst met prijs en levertijd van vandaag, de keuzehulp als knop eronder; per product een eerlijke beperking; afraden alleen
// op harde feiten (maat, onderdelen, levertijd tegenover een deadline), want we hebben de producten niet zelf vastgehad (Henkjan: nog niet
// zelf bestellen). Alles wat AI moet kunnen citeren staat in de HTML. Geen gedachtestreepjes. Prijzen live uit de shopcatalogus.
// Kliks naar de shop gaan via /naar/<pid> (api/shop.js op=gidsuit): Clickmind meet de keten tot betaald per gids.
import { kv } from '../lib/db.js';
import { look } from '../lib/look.js';
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
const KAD_D = '--ink:#F3F4F6;--ink-2:#D1D5DB;--ink-3:#9CA3AF;--line:rgba(255,255,255,.09);--bg:#0f1012;--bg-2:#17181c;--acc:#60A5FA;--acc-2:#13202E;--on-acc:#0f1012';
const KAD_D2 = '--prim:#F3F4F6;--on-prim:#0f172a;--link:#60A5FA;--nav:rgba(20,21,23,.86);--veld:hsla(0,0%,100%,.07);--sh:0 16px 40px -12px rgba(0,0,0,.6)';
const CSS_KADOLY = `:root{--ink:#0B0D12;--ink-2:#3F4654;--ink-3:#6B7280;--line:#E6E8EB;--bg:#fff;--bg-2:#F6F7F9;--acc:#1D9BF0;--acc-2:#E8F4FD;--on-acc:#fff}${KAD}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){${KAD_D};${KAD_D2}}}:root[data-theme=dark]{${KAD_D};${KAD_D2}}
body{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:1rem;line-height:1.6}a{color:var(--link)}.kicker,.lab2{color:var(--link)}
.knop,.btn{background:var(--prim);color:var(--on-prim);border-radius:12px;font-weight:700;padding:11px 16px;border:0}.answer{border-left-color:var(--acc)}h1{letter-spacing:-.03em}
.kn{position:sticky;top:0;z-index:20;background:var(--nav);-webkit-backdrop-filter:saturate(180%) blur(12px);backdrop-filter:saturate(180%) blur(12px);border-bottom:1px solid var(--line)}
.kn-in{max-width:72rem;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:14px}.kn-merk{display:inline-flex;align-items:center;gap:8px;color:var(--ink);text-decoration:none;font-weight:700;font-size:1.125rem;letter-spacing:-.02em;flex:none}
.kn-gids{font-weight:600;color:var(--ink-3);font-size:.9375rem;border-left:1px solid var(--line);padding-left:9px;margin-left:1px}.kn-zoek{position:relative;flex:1;max-width:36rem;margin:0 auto}
.kn-zoek input{width:100%;height:44px;border:1px solid transparent;border-radius:12px;background:var(--veld);color:var(--ink);font:inherit;font-size:1rem;padding:0 14px 0 40px;outline:none;-webkit-appearance:none;appearance:none}
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
.kc-in input{flex:1;min-width:0;height:44px;border:1px solid var(--line);border-radius:12px;background:var(--bg);color:var(--ink);font:inherit;font-size:1rem;padding:0 12px}.kc-in button{height:44px;border:0;border-radius:12px;background:var(--prim);color:var(--on-prim);font:inherit;font-weight:700;padding:0 16px;cursor:pointer}
.kc-voet{font-size:.75rem;color:var(--ink-3);padding:0 14px 10px}.kc-voet a{color:var(--ink-3)}@media(max-width:640px){.kc{right:0;left:0;bottom:0;width:100%;height:88vh;border-radius:16px 16px 0 0}}
.kv{border-top:1px solid var(--line);margin:48px 0 0;padding:28px 0 40px;font-size:.875rem;color:var(--ink-3)}.kv-in{max-width:72rem;margin:0 auto;padding:0 16px}.kv-cols{display:grid;grid-template-columns:1.3fr 1fr 1fr 1fr;gap:22px}.kv-h{font-weight:700;color:var(--ink);margin:0 0 8px}.kv a{display:block;color:var(--ink-2);text-decoration:none;margin:0 0 6px}.kv a:hover{color:var(--ink)}
.kv-merk{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink);font-size:1rem}.kv-pay{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:12px 0 0;font-size:.75rem}.kv-pay img,.kv-pay svg{display:block;height:18px;width:auto}.kv-onder{border-top:1px solid var(--line);margin:22px 0 0;padding:16px 0 0;display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:space-between}.kv-onder a{display:inline;margin:0}.kv-legal{display:flex;flex-wrap:wrap;gap:14px}
@media(max-width:720px){.kv-cols{grid-template-columns:1fr 1fr}}main.wrap{padding-top:22px}`;
const CSS_EXTRA = `.wrap{max-width:46rem}.kaart{display:grid;grid-template-columns:112px 1fr;gap:14px;border:1px solid var(--line);border-radius:14px;padding:14px;margin:0 0 12px;background:var(--bg)}
.kaart img{width:112px;height:112px;object-fit:cover;border-radius:10px;background:var(--acc-2)}.kaart h3{margin:2px 0 4px;font-size:1.0625rem;line-height:1.3}.lab2{font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--acc)}
.prijs{font-weight:750}.klein{font-size:.875rem;color:var(--ink-2)}.let{font-size:.875rem;margin:6px 0 0}.knop{display:inline-block;margin:10px 0 0;background:var(--acc);color:var(--on-acc,#fff);padding:9px 14px;border-radius:10px;font-weight:650;text-decoration:none}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin:0 0 14px}table{border-collapse:collapse;width:100%;font-size:.9375rem}th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}tr:last-child td{border-bottom:0}
.check{border:1px solid var(--acc);border-radius:14px;padding:16px;margin:0 0 18px;background:var(--acc-2)}.check fieldset{border:0;padding:0;margin:0 0 12px}.check legend{font-weight:650;margin:0 0 6px}.check label{display:block;margin:0 0 6px}.uitkomst{margin:10px 0 0;font-size:1rem}
details{border-bottom:1px solid var(--line);padding:10px 0}summary{cursor:pointer;font-weight:650}@media (max-width:520px){.kaart{grid-template-columns:84px 1fr}.kaart img{width:84px;height:84px}}`;

function kop(titel, besch, pad, extra, zoekQ) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(besch)}"><link rel="canonical" href="${HOST}${pad}">${META ? `<meta name="google-site-verification" content="${esc(META)}">` : ''}<meta property="og:title" content="${esc(titel)}"><meta property="og:description" content="${esc(besch)}"><meta property="og:url" content="${HOST}${pad}"><meta property="og:type" content="article"><meta property="og:locale" content="nl_NL"><link rel="icon" type="image/svg+xml" href="https://cdn.kadoly.com/icon/shop/shop-mark.svg?v=1"><link rel="icon" type="image/png" sizes="32x32" href="https://cdn.kadoly.com/icon/shop/icon-32.png?v=1"><link rel="apple-touch-icon" sizes="180x180" href="https://cdn.kadoly.com/icon/shop/apple-180.png?v=1"><meta name="theme-color" content="#ffffff">${extra || ''}<style>${look(ACC)}${CSS_EXTRA}${CSS_KADOLY}</style></head><body>${KOPBALK(zoekQ)}<main class="wrap">`;
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
const VOET = (g, kans) => `<hr style="border:0;border-top:1px solid var(--line);margin:34px 0 14px"><p class="klein">Een gids van <a href="https://kadoly.com">Kadoly</a>, de webshop met producten van onafhankelijke makers. Prijzen en levertijden komen elke paar minuten uit de winkel zelf${g ? ', laatst inhoudelijk bijgewerkt op ' + esc(g.bijgewerkt) : ''}. Wij verdienen aan een bestelling in onze eigen winkel; daarom staat bij elk product ook waarvoor het niet geschikt is.</p><p class="klein"><a href="/">Alle gidsen</a> · <a href="#" data-kc>Stel een vraag</a></p></main>${VOETBALK}${CHAT}${hulpScript(g ? g.slug : '_home', kans)}</body></html>`;

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
  return kop('Zoeken: ' + vraag + ' | Kadoly gids', 'Zoeken in de winkel van Kadoly.', '/zoek', '<meta name="robots" content="noindex, follow">', vraag) + `<h1>Zoeken: ${esc(vraag)}</h1>${r.gidsen.length ? `<h2>Gidsen</h2><ul>${r.gidsen.map(g => `<li><a href="/${esc(g.slug)}">${esc(g.h1)}</a></li>`).join('')}</ul>` : ''}${r.producten.length ? `<h2>In de winkel</h2>` + r.producten.map(p => `<article class="kaart"><a href="/naar/${encodeURIComponent(p.pid)}?g=zoek&b=zoek&h=${r.h}" rel="nofollow">${p.img ? `<img src="${esc(p.img)}" width="112" height="112" alt="${esc(p.naam)}" loading="lazy">` : ''}</a><div><h3>${esc(p.naam)}</h3><div><span class="prijs">${esc(p.prijsTekst)}</span>${p.datum ? ` <span class="klein">· rond ${esc(p.datum)} in huis als je vandaag bestelt</span>` : ''}</div><a class="knop" href="/naar/${encodeURIComponent(p.pid)}?g=zoek&b=zoek&h=${r.h}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`).join('') : '<p>Niets gevonden. <a href="#" data-kc>Stel je vraag</a>, dan zoeken we mee.</p>'}` + VOET(null, kans);
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

function productKaart(x, slug, blok, eerste) {
  const dat = leverDatum(x.lt);
  return `<article class="kaart"><a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}" rel="nofollow">${x.img ? `<img src="${esc(x.img)}" width="112" height="112" alt="${esc(x.naam)}" ${eerste ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : ''}</a><div>
<div class="lab2">${esc(x.label)}${x.meest ? ' · meest gekozen door lezers' : ''}</div><h3>${esc(x.naam)}</h3><div><span class="prijs">${euro(x.prijs + x.verzending)}</span> <span class="klein">inclusief ${euro(x.verzending)} verzending · ${x.lt ? 'rond ' + esc(nlDatum(dat)) + ' in huis als je vandaag bestelt' : 'levertijd bij het product'}</span></div>
<p class="let">${esc(x.waarom)}</p>${x.beperking ? `<p class="let"><b>Let op:</b> ${esc(x.beperking)}</p>` : ''}<a class="knop" href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(slug)}&b=${blok}" rel="nofollow">Bekijk bij Kadoly</a></div></article>`;
}

// baken: telt echte lezers in de browser (zodat de pagina aan de rand van Vercel bewaard kan worden): weergave met herkomst, 15 en 60 seconden, scrollen
function baken(slug) {
  return `<script>(function(){var g=${JSON.stringify(slug)},s={};function t(x){if(s[x])return;s[x]=1;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(g)+'&s='+x)}catch(e){}}var r=document.referrer||'',b=/google\./.test(r)?'google':/bing\./.test(r)?'bing':/chatgpt|openai/.test(r)?'chatgpt':/perplexity/.test(r)?'perplexity':/copilot|edgeservices/.test(r)?'copilot':/gemini\.google/.test(r)?'gemini':/claude\.ai/.test(r)?'claude':/duckduckgo/.test(r)?'duckduckgo':/kadoly\.com/.test(r)?'kadoly':r?'overig':'direct';t('v-'+b);setTimeout(function(){if(!document.hidden)t('t15')},15000);setTimeout(function(){if(!document.hidden)t('t60')},60000);addEventListener('scroll',function(){var h=document.documentElement,p=(h.scrollTop+innerHeight)/h.scrollHeight;if(p>.5)t('s50');if(p>.9)t('s90')},{passive:true});})();</script>`;
}
async function gidsPagina(g) {
  const cat = await catalogus();
  const items = g.keuze.map(k => { const i = cat[k.pid]; if (!i || i.vr === false) return null; return Object.assign({}, k, { naam: k.naam || i.t, prijs: N(i.p), verzending: i.fs ? 0 : N(i.vk), lt: N(i.lt) || 0, img: i.img || '', merk: i.b || '' }); }).filter(Boolean);
  const perPid = {}; items.forEach(x => { perPid[x.pid] = x; });
  // volgorde leert van de lezers: na 60 weergaven telt de klikkans per product (met voorkennis voor de redactievolgorde), daarvoor de redactievolgorde
  const L = await geleerd(g.slug); const vw = N(L._v);
  if (vw >= 60) { items.forEach((x, i) => { x._s = (N(L[x.pid]) + Math.max(0.2, 1.5 - i * 0.2)) / (vw + 30); }); items.sort((a, b) => b._s - a._s); }
  const top = items.reduce((m, x) => (N(L[x.pid]) > N(L[m && m.pid])) ? x : m, null); if (top && N(L[top.pid]) >= 10) top.meest = true;
  const rijen = (g.tabel || []).map(r => { const x = perPid[r.pid]; return `<tr><td>${esc(r.situatie)}</td><td>${esc(r.advies)}${x ? `<br><a href="/naar/${encodeURIComponent(x.pid)}?g=${encodeURIComponent(g.slug)}&b=tabel" rel="nofollow">${esc(x.naam)}</a>, ${euro(x.prijs + x.verzending)}` : ''}</td></tr>`; }).join('');
  const checkData = JSON.stringify({ vragen: g.check ? g.check.vragen : [], regels: g.check ? g.check.regels : [], producten: Object.fromEntries(items.map(x => [x.pid, { naam: x.naam, prijs: euro(x.prijs + x.verzending), lt: x.lt }])), slug: g.slug }).replace(/</g, '\\u003c');
  const check = g.check ? `<section class="check" id="check"><h2 style="margin:0 0 6px">Past het bij jou? Snelle check</h2><p class="klein" style="margin:0 0 12px">Twee of drie vragen. De uitkomst kan ook zijn dat je het beter niet koopt.</p><form id="gf">${g.check.vragen.map(v => `<fieldset><legend>${esc(v.vraag)}</legend>${v.opties.map(o => `<label><input type="radio" name="${esc(v.k)}" value="${esc(o[0])}"> ${esc(o[1])}</label>`).join('')}</fieldset>`).join('')}<button class="knop" type="submit" style="border:0;cursor:pointer">Laat zien wat past</button></form><div class="uitkomst" id="gu" aria-live="polite"></div></section>
<script>(function(){var D=${checkData};var f=document.getElementById('gf'),u=document.getElementById('gu');f.addEventListener('submit',function(e){e.preventDefault();var a={};D.vragen.forEach(function(v){var x=f.querySelector('input[name="'+v.k+'"]:checked');if(x)a[v.k]=x.value;});if(Object.keys(a).length<D.vragen.length){u.innerHTML='Kies bij elke vraag een antwoord.';return;}var r=null;for(var i=0;i<D.regels.length;i++){var R=D.regels[i],ok=true;for(var k in R.als){if(R.als[k].indexOf(a[k])<0){ok=false;break;}}if(ok){r=R;break;}}if(!r){u.innerHTML='Kies bij elke vraag een antwoord.';return;}var h='<p><b>'+r.kop+'</b></p><p>'+r.tekst+'</p>';if(r.pid&&D.producten[r.pid]){var p=D.producten[r.pid];h+='<p><a class="knop" href="/naar/'+encodeURIComponent(r.pid)+'?g='+encodeURIComponent(D.slug)+'&b=check" rel="nofollow">'+p.naam+', '+p.prijs+'</a></p>';}u.innerHTML=h;try{navigator.sendBeacon('/gidstel?g='+encodeURIComponent(D.slug)+'&s=check-'+(r.id||'x'));}catch(x){}});})();</script>` : '';
  const delen = 'https://wa.me/?text=' + encodeURIComponent(g.h1 + ' ' + HOST + '/' + g.slug);
  const ogImg = items[0] && items[0].img ? `<meta property="og:image" content="${esc(items[0].img)}"><meta name="twitter:card" content="summary_large_image">` : '';
  const andere = GIDS_IDS.filter(id => id !== g.slug).map(id => GIDSEN[id]);
  return kop(g.titel, g.beschrijving, '/' + g.slug, ogImg + `<script type="application/ld+json">${ldJson(g, items)}</script>`) +
    `<nav class="klein" aria-label="Kruimelpad" style="margin:0 0 14px"><a href="/">Kadoly gids</a> › ${esc(g.h1)}</nav><p class="kicker">${esc(g.kicker)}</p><h1>${esc(g.h1)}</h1><div class="answer"><p><strong>In het kort.</strong> ${esc(g.kort)}</p></div>
<h2>Onze keuze</h2>${items.map((x, i) => productKaart(x, g.slug, 'keuze', i === 0)).join('')}
${rijen ? `<h2>${esc(g.tabelKop || 'Welke past bij jouw situatie?')}</h2><div class="tw"><table><tr><th>Jouw situatie</th><th>Ons advies</th></tr>${rijen}</table></div>` : ''}
${check}
${(g.uitleg || []).map(b => `<h2>${esc(b.kop)}</h2>${b.alineas.map(p => `<p>${esc(p)}</p>`).join('')}`).join('')}
<h2>Zo kozen we</h2><p>${esc(g.zoKozenWe)}</p>
<h2>Zo werkt een bestelling bij Kadoly</h2><ul><li>Je koopt bij Kadoly (ADSFAIR B.V.) en betaalt met iDEAL, PayPal of creditcard.</li><li>Het merk verstuurt het pakket rechtstreeks naar jou, met track en trace. Bij je eerste bestelling is de verzending gratis.</li><li>Valt het tegen? Je hebt 14 dagen na ontvangst: je krijgt een retourlabel en het hele bedrag terug.</li><li>Neem je meer producten, dan krijg je bundelkorting: 5% op 2 tot 20% op 6 producten.</li></ul>
${g.faq && g.faq.length ? `<h2>Veelgestelde vragen</h2>${g.faq.map(f => `<details><summary>${esc(f.v)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
<p style="margin:22px 0 0"><a class="knop" href="${esc(delen)}" rel="nofollow noopener">Deel deze gids via WhatsApp</a></p>
${andere.length ? `<h2>Andere gidsen van Kadoly</h2><ul>${andere.map(a => `<li><a href="/${esc(a.slug)}">${esc(a.h1)}</a></li>`).join('')}</ul>` : ''}
${baken(g.slug)}` + VOET(g, await armKans());
}

function home(kans) {
  const lijst = GIDS_IDS.map(id => GIDSEN[id]).map(g => `<article class="kaart" style="grid-template-columns:1fr"><div><div class="lab2">${esc(g.kicker)}</div><h3><a href="/${esc(g.slug)}">${esc(g.h1)}</a></h3><p class="let">${esc(g.beschrijving)}</p></div></article>`).join('');
  return kop('Kadoly gids: eerlijk kiezen wat bij je past', 'Keuzehulpen van Kadoly: welk product past bij jou, met prijs en levertijd van vandaag en waarvoor het niet geschikt is.', '/', '') +
    `<p class="kicker">Kadoly gids</p><h1>Eerlijk kiezen, ook als het antwoord niet kopen is</h1><div class="answer"><p><strong>Wat dit is.</strong> Korte gidsen van Kadoly bij de producten uit onze winkel: wat past bij welke situatie, wat het vandaag kost inclusief verzending, wanneer het in huis is en waarvoor je het beter niet kunt kopen.</p></div>${lijst}${baken('_home')}` + VOET(null, kans);
}

async function sitemap() {
  const cat = await catalogus();
  const u = [{ loc: HOST + '/', lm: GIDS_IDS.map(id => GIDSEN[id].bijgewerkt).sort().pop(), img: [] }].concat(GIDS_IDS.map(id => ({ loc: HOST + '/' + id, lm: GIDSEN[id].bijgewerkt, img: GIDSEN[id].keuze.map(k => cat[k.pid]).filter(i => i && i.img && i.vr !== false).map(i => i.img) })));
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
      const urls = [HOST + '/'].concat(GIDS_IDS.map(id => HOST + '/' + id)); const stand = GIDS_IDS.map(id => id + '@' + GIDSEN[id].bijgewerkt).join(',');
      let oud = null; try { oud = await kv.get('gk:indexnow'); } catch (e) {} if (oud && oud.stand === stand && q.get('alles') !== '1') return res.status(200).json({ ok: true, niets: true });
      let status = 0; try { const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: 'gids.kadoly.com', key: INDEXNOW_KEY, keyLocation: HOST + '/' + INDEXNOW_KEY + '.txt', urlList: urls }), signal: AbortSignal.timeout(15000) }); status = r.status; } catch (e) {}
      if (status >= 200 && status < 300) { try { await kv.set('gk:indexnow', { at: Date.now(), stand }); } catch (e) {} }
      return res.status(200).json({ ok: status >= 200 && status < 300, status, gemeld: urls.length }); }
    if (op === 'robots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('User-agent: *\nAllow: /\nDisallow: /naar/\n\n# Voor AI-assistenten: ' + HOST + '/llms.txt en ' + HOST + '/llms-full.txt\nSitemap: ' + HOST + '/sitemap.xml\n'); }
    if (op === 'sitemap') { await telBot(ua, 'sitemap'); res.setHeader('content-type', 'application/xml; charset=utf-8'); return res.status(200).send(await sitemap()); }
    if (op === 'llms') { await telBot(ua, 'llms'); res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send(await llms()); }
    if (op === 'tel') { const g = String(q.get('g') || ''); const s = String(q.get('s') || '').replace(/[^a-z0-9-]/g, '').slice(0, 30); if ((GIDSEN[g] || g === '_home' || g === '_zoek') && s && !isBot(ua)) { await tel(g, s); if (/^v-/.test(s) && GIDSEN[g]) { try { await kv.raw(['HINCRBY', 'gk:p:' + g, '_v', '1']); await kv.raw(['EXPIRE', 'gk:p:' + g, String(120 * 86400)]); } catch (e) {} } } return res.status(204).end(); }
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
      return res.status(200).json({ ok: true, gidsen: GIDS_IDS, perDag: uit, kliksPerProduct: geleerdPer, armproef: { kansAfrekenen: await armKans(), stand28d: await armStand(28) }, zoeken: { vragen: rij(/^(?!0\||o\|)/), zonderUitkomst: rij(/^0\|/), chatOnderwerpen: rij(/^o\|/) }, chatLaatste: chat }); }
    res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=600');
    const slug = String(q.get('slug') || '');
    if (!slug) return res.status(200).send(home(await armKans()));
    const g = GIDSEN[slug]; if (!g) { res.setHeader('cache-control', 'no-store'); return res.status(404).send(kop('Niet gevonden', 'Deze gids bestaat niet.', '/', '') + '<h1>Deze gids bestaat (nog) niet</h1><p><a href="/">Naar alle gidsen</a></p>' + VOET(null, 0.5)); }
    await telBot(ua, slug);
    return res.status(200).send(await gidsPagina(g));
  } catch (e) { res.setHeader('cache-control', 'no-store'); return res.status(500).send('Er ging iets mis: ' + esc(String(e && e.message || e).slice(0, 120))); }
}
