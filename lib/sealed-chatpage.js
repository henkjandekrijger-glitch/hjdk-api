// Sealed Intent: de pagina rond de lerende chat. Opmaak volgt outname.now (wit, Inter, smalle kolom, zelfde blauw), zakelijker.
// Henkjan 16 nov 2026: "Pak gewoon outname.now looks ... Een chat ... Verder staat er heel weinig rond de chat. In de chat wordt alles geregeld."
import { BASE, zegel } from './sealed.js';
import { LP, LPT, LP_INDEX } from './sealed-lp.js';
import { TEKST, chatBrowser } from './sealed-chat.js';
import { manageMarkup, FLOW } from './sealed-pages.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MEET = 'https://meeting.nexy.works/a54blu', WA = 'https://wa.me/31655395630';
// Wie erachter zit, onder de chat (panel 17 nov 2026: de eigenaar mag anoniem zijn, de aanbieder niet; Henkjan: "Ik ben ook oprichter van Nexy ...
// Nexy is zakelijker" en "Ze kunnen me appen als ze vragen hebben maar totaal anoniem blijven kan natuurlijk ook").
const WIE = {
  nl: ['Van Henkjan de Krijger, oprichter van Mijndomein.nl en Nexy. We zijn net begonnen: je bent een van de eersten.', 'Vragen?', 'App Henkjan', 'Anoniem blijven kan ook.'],
  en: ['By Henkjan de Krijger, founder of Mijndomein.nl and Nexy. We have just started: you are one of the first.', 'Questions?', 'Message Henkjan on WhatsApp', 'Staying anonymous is fine too.'],
  de: ['Von Henkjan de Krijger, Gründer von Mijndomein.nl und Nexy. Wir haben gerade begonnen: Sie gehören zu den Ersten.', 'Fragen?', 'Schreiben Sie Henkjan per WhatsApp', 'Anonym bleiben geht auch.'],
};
const HUB = {
  nl: { title: 'Sealed Intent: een bedrijf kopen of verkopen zonder dat iemand het weet', desc: 'Eigenaren leggen zonder naam vast onder welke voorwaarden ze zouden verkopen. Kopers leggen vast wat ze zoeken. Pas bij twee keer ja volgt een introductie.', eyebrow: 'Kopen en verkopen, verzegeld', h1: 'Een bedrijf kopen of verkopen, zonder dat iemand het weet.', kort: 'Zonder naam, zonder advertentie. Alles regel je hier.' },
  en: { title: 'Sealed Intent: buy or sell a business without anyone knowing', desc: 'Owners set down, without a name, the terms on which they would sell. Buyers set down what they are looking for. An introduction follows only after two yeses.', eyebrow: 'Buying and selling, sealed', h1: 'Buy or sell a business without anyone knowing.', kort: 'No name, no listing. You arrange everything right here.' },
  de: { title: 'Sealed Intent: ein Unternehmen kaufen oder verkaufen, ohne dass es jemand erfährt', desc: 'Inhaber halten ohne Namen fest, zu welchen Bedingungen sie verkaufen würden. Käufer halten fest, was sie suchen. Eine Vorstellung folgt erst nach zweimal Ja.', eyebrow: 'Kaufen und verkaufen, versiegelt', h1: 'Ein Unternehmen kaufen oder verkaufen, ohne dass es jemand erfährt.', kort: 'Ohne Namen, ohne Inserat. Alles regeln Sie hier.' },
};
const KORT = {
  buyers: { nl: 'Eigenaren antwoorden zonder naam. De eerste introductie is gratis.', en: 'Owners reply without a name. The first introduction is free.', de: 'Inhaber antworten ohne Namen. Die erste Vorstellung ist kostenlos.' },
  owners: { nl: 'Geen naam, geen e-mail, geen advertentie. De koper betaalt.', en: 'No name, no email, no listing. The buyer pays.', de: 'Kein Name, keine E-Mail, kein Inserat. Der Käufer zahlt.' },
};
const CSS = `:root{--ink:#111113;--line:#E5E7EB}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:#fff;color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--ink);text-decoration:none}a:hover{text-decoration:underline}a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.top-in{max-width:1040px;margin:0 auto;padding:22px 26px;display:flex;align-items:center}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.02em;--bg:#fff}.brand:hover{text-decoration:none}.brand span span{font-weight:400}
.langs{margin-left:auto;display:flex;gap:14px}.langs a[aria-current]{font-weight:700}
main{max-width:680px;margin:0 auto;padding:48px 26px 0}
h1{font-size:clamp(24px,3.4vw,30px);line-height:1.15;letter-spacing:-.03em;font-weight:700;margin:0 0 10px;text-wrap:balance}
#kort{margin:0 0 40px}
[hidden]{display:none!important}#log{display:flex;flex-direction:column;gap:14px}#log p{margin:0}#som:empty{display:none}.kaart{border:1px solid var(--line);border-radius:16px;overflow:hidden}.kt{display:flex;align-items:center;gap:12px;padding:16px 22px;border-bottom:1px solid var(--line)}.kl{margin-left:auto;font-size:13px;letter-spacing:.1em;text-transform:uppercase}.kr{display:grid;grid-template-columns:150px 1fr;gap:16px;padding:14px 22px;border-bottom:1px solid var(--line)}.ka{font-weight:700}.kb{display:flex;flex-direction:column;gap:4px;min-width:0}.kb.kc{flex-direction:row;flex-wrap:wrap;gap:8px}.kb.kc .chip{min-height:0;padding:5px 14px}.kf{font-size:13px;line-height:1.6;padding:14px 22px;margin:0}.vak{background:#F3F4F6;border-radius:12px;padding:18px 22px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}.vak p{margin:0}@media(max-width:640px){.kr{grid-template-columns:1fr;gap:4px}.kt,.kr,.kf,.vak{padding-left:16px;padding-right:16px}}#som,.rij div{display:flex;flex-wrap:wrap;gap:8px}.chip{cursor:default}.rij b{display:block;margin-bottom:8px}.rij ul{margin:0;padding-left:20px}.rij li{padding:2px 0}
#log .bot{font-size:26px;font-weight:700;letter-spacing:-.025em;line-height:1.25;animation:in .25s ease-out}@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){#log .bot{animation:none}}#som{padding-top:28px}#som .chip{background:#F3F4F6;border-color:#F3F4F6;color:var(--ink)}#log .link{word-break:break-all;text-decoration:underline;text-underline-offset:3px}
#pills{padding:18px 0 0;display:flex;flex-wrap:wrap;gap:10px}#pills:empty{padding:0}.br{flex-basis:100%;height:0}
.pill,#typ input,#typ button{font:inherit;border:1px solid var(--ink);border-radius:999px;padding:10px 20px;line-height:1.3;min-height:46px}
.pill{background:#fff;color:var(--ink);cursor:pointer;text-align:left;display:inline-flex;align-items:center}.pill:hover{text-decoration:none}
.pill.aan,.pill.door,#typ button{background:var(--ink);color:#fff;cursor:pointer}
#typ{display:flex;gap:10px;padding:22px 0 0}#typ input{flex:1;min-width:0;background:#fff;color:var(--ink)}#typ input::placeholder{color:var(--ink);opacity:.5}#typ input:focus{outline:0;box-shadow:0 0 0 1px var(--ink)}#typ button{white-space:nowrap}
.wie{margin:44px 0 0}.wie a,.art a{text-decoration:underline;text-underline-offset:3px}.top{margin:0 0 36px}.art{margin-top:64px;border-top:1px solid var(--line);padding-top:4px}.art h2{font-size:20px;line-height:1.3;letter-spacing:-.02em;margin:36px 0 10px}.art h3{font-size:17px;margin:22px 0 4px}.art p{margin:0 0 12px}.art ul{margin:0 0 12px;padding-left:20px}.art .kr.kg{grid-template-columns:1fr auto;align-items:baseline}.art .kr:last-child{border-bottom:0}.art .knop{display:flex;flex-wrap:wrap;gap:10px}.art .knop a{text-decoration:none}
.meer{margin:72px 0 0;border-top:1px solid var(--line);padding-top:22px}.meer a{display:block;padding:4px 0}
footer{border-top:1px solid var(--line);margin-top:72px}footer div{max-width:680px;margin:0 auto;padding:18px 26px 26px;font-size:13px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media(max-width:640px){.top-in{padding:16px 18px}main{padding:28px 18px 0}#kort{margin-bottom:24px}#log .bot{font-size:22px}#pills{gap:8px;padding-top:14px}.pill,#typ input,#typ button{padding:8px 16px;min-height:42px}.art .kr.kg{grid-template-columns:1fr auto}}`;

// kind: 'buyers' | 'owners' | null (voordeur met rolkeuze). links: [{href, tekst}]. pagina: een inhoudspagina uit lib/sealed-info.js
// ({ title, desc, h1, top, rest, canon, alts, rol, ld }): korte tekst boven, dan de chat, dan de rest. status 404: zelfde pagina, noindex.
export function renderChatPage(taal, kind, { gscMeta, growthScript = '', links = [], pagina = null, noindex = false } = {}) {
  const C = LPT[taal], X = TEKST[taal]; if (!C || !X) return null;
  const rol = pagina ? pagina.rol : kind;
  const P = pagina ? { title: pagina.title + ' | Sealed Intent', desc: pagina.desc, h1: pagina.h1, kort: rol ? KORT[rol][taal] : HUB[taal].kort } : kind ? { title: C[kind].title, desc: C[kind].desc, h1: C[kind].h1, kort: KORT[kind][taal] } : HUB[taal];
  const pad = t => pagina ? (pagina.alts[t] || '').replace(BASE, '') || '/' + t : kind ? '/' + t + '/' + LP[kind][t] : '/' + t, canon = pagina ? pagina.canon : BASE + pad(taal), index = !noindex && (pagina || !kind || LP_INDEX);
  const talenLijst = Object.keys(LPT).filter(t => !pagina || pagina.alts[t]);
  const alts = talenLijst.map(t => `<link rel="alternate" hreflang="${t}" href="${BASE + pad(t)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${pagina || kind ? BASE + pad(talenLijst.includes('en') ? 'en' : taal) : BASE + '/'}">`;
  const talen = talenLijst.map(t => `<a href="${pad(t)}" hreflang="${t}"${t === taal ? ' aria-current="page"' : ''}>${t.toUpperCase()}</a>`).join('');
  const org = { '@type': 'Organization', '@id': BASE + '/#org', name: 'Sealed Intent', url: BASE + '/', logo: BASE + '/icon-512.png', founder: { '@type': 'Person', name: 'Henkjan de Krijger' }, parentOrganization: { '@type': 'Organization', name: 'Adsfair B.V.' } }, site = { '@type': 'WebSite', '@id': BASE + '/#site', name: 'Sealed Intent', url: BASE + '/', publisher: { '@id': BASE + '/#org' } };
  const ld = noindex ? '' : `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, site, ...(pagina ? pagina.ld : [{ '@type': 'WebPage', url: canon, name: P.title, description: P.desc, inLanguage: taal, isPartOf: { '@id': BASE + '/#site' } }])] }).replace(/</g, '\\u003c')}</script>`;
  const cfg = JSON.stringify({ taal, rol: rol || '', T: X, meet: MEET, wa: WA }).replace(/</g, '\\u003c');
  const W = WIE[taal];
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(P.title)}</title><meta name="description" content="${esc(P.desc)}"><link rel="canonical" href="${canon}">${alts}${index ? '' : '<meta name="robots" content="noindex, follow">'}${gscMeta ? `<meta name="google-site-verification" content="${esc(gscMeta)}">` : ''}<meta property="og:title" content="${esc(P.h1)}"><meta property="og:description" content="${esc(P.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${BASE}/icon-512.png"><link rel="icon" href="/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#ffffff"><style>${CSS}</style>${ld}</head><body>
<header><div class="top-in"><a class="brand" href="/${taal}">${zegel(26)}<span>sealed<span>intent</span></span></a><nav class="langs" aria-label="Language">${talen}</nav></div></header>
<main><h1>${esc(P.h1)}</h1>${pagina ? `<p class="top">${esc(pagina.top)}</p>` : ''}<p id="kort">${esc(P.kort)}</p>
<section aria-label="Chat"><div id="log" aria-live="polite"></div><div id="pills"></div><form id="typ" autocomplete="off"><input name="t" type="text" maxlength="200" placeholder="${esc(X.ph)}" aria-label="${esc(X.ph)}"><button type="submit">${esc(X.stuur)} <span aria-hidden="true">→</span></button></form><div id="som"></div></section>
<p class="wie">${esc(W[0])} ${esc(W[1])} <a href="${WA}" target="_blank" rel="noopener">${esc(W[2])}</a>. ${esc(W[3])}</p>
<noscript><p>${esc(W[1])} <a href="${WA}">${esc(W[2])}</a>.</p></noscript>
${pagina ? `<article class="art">${pagina.rest}</article>` : ''}
${links.length ? `<nav class="meer" aria-label="${esc(X.meer)}">${links.map(l => `<a href="${esc(l.href)}">${esc(l.tekst)}</a>`).join('')}</nav>` : ''}</main>
<footer><div><span>${esc(C.foot)}</span><a href="/${taal}/${C.privacySlug}">${esc(C.privacy)}</a></div></footer>
<script>(${chatBrowser.toString()})(${cfg});</script>${growthScript}</body></html>`;
}

// De pagina achter de privélink, in dezelfde opmaak. Geen meetscript, noindex, niets van buiten geladen.
export function renderManagePage(taal) {
  const C = LPT[taal]; if (!C || !FLOW[taal]) return null;
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(FLOW[taal].privateTitle)} | Sealed Intent</title><meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer"><link rel="icon" href="/logo.svg" type="image/svg+xml"><style>${CSS}main p{margin:0 0 14px}#private-record{border:1px solid var(--line);border-radius:16px;padding:18px 22px;margin:22px 0}#private-record:empty{display:none}#private-record p:last-child{margin:0}.btn{font:inherit;border:1px solid var(--ink);border-radius:999px;padding:10px 20px;min-height:46px;background:var(--ink);color:#fff;cursor:pointer}</style></head><body>
<header><div class="top-in"><a class="brand" href="/${taal}">${zegel(26)}<span>sealed<span>intent</span></span></a></div></header>
<main>${manageMarkup(taal)}</main>
<footer><div><span>${esc(C.foot)}</span><a href="/${taal}/${C.privacySlug}">${esc(C.privacy)}</a></div></footer></body></html>`;
}
