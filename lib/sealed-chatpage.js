// Sealed Intent: de pagina rond de lerende chat. Opmaak volgt outname.now (wit, Inter, smalle kolom, zelfde blauw), zakelijker.
// Henkjan 16 nov 2026: "Pak gewoon outname.now looks ... Een chat ... Verder staat er heel weinig rond de chat. In de chat wordt alles geregeld."
import { BASE, zegel } from './sealed.js';
import { LP, LPT, LP_INDEX } from './sealed-lp.js';
import { TEKST, chatBrowser } from './sealed-chat.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MEET = 'https://meeting.nexy.works/a54blu';
const HUB = {
  nl: { title: 'Sealed Intent: een bedrijf kopen of verkopen zonder dat iemand het weet', desc: 'Eigenaren leggen zonder naam vast onder welke voorwaarden ze zouden verkopen. Kopers leggen vast wat ze zoeken. Pas bij twee keer ja volgt een introductie.', eyebrow: 'Kopen en verkopen, verzegeld', h1: 'Een bedrijf kopen of verkopen, zonder dat iemand het weet.', kort: 'Zonder naam, zonder advertentie. Alles regel je hier.' },
  en: { title: 'Sealed Intent: buy or sell a business without anyone knowing', desc: 'Owners set down, without a name, the terms on which they would sell. Buyers set down what they are looking for. An introduction follows only after two yeses.', eyebrow: 'Buying and selling, sealed', h1: 'Buy or sell a business without anyone knowing.', kort: 'No name, no listing. You arrange everything right here.' },
  de: { title: 'Sealed Intent: ein Unternehmen kaufen oder verkaufen, ohne dass es jemand erfährt', desc: 'Inhaber halten ohne Namen fest, zu welchen Bedingungen sie verkaufen würden. Käufer halten fest, was sie suchen. Eine Vorstellung folgt erst nach zweimal Ja.', eyebrow: 'Kaufen und verkaufen, versiegelt', h1: 'Ein Unternehmen kaufen oder verkaufen, ohne dass es jemand erfährt.', kort: 'Ohne Namen, ohne Inserat. Alles regeln Sie hier.' },
};
const KORT = {
  buyers: { nl: 'Eigenaren antwoorden zonder naam. Je betaalt pas voor een introductie die zij goedkeuren.', en: 'Owners reply without a name. You pay only for an introduction they approve.', de: 'Inhaber antworten ohne Namen. Sie zahlen erst für eine Vorstellung, der sie zustimmen.' },
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
h1{font-size:clamp(30px,5vw,44px);line-height:1.1;letter-spacing:-.035em;font-weight:700;margin:0 0 14px;text-wrap:balance}
#kort{margin:0 0 44px}
[hidden]{display:none!important}#log{display:flex;flex-direction:column;gap:14px}#log p{margin:0}#som:empty{display:none}#log>.pill{align-self:flex-start}#som,.rij div{display:flex;flex-wrap:wrap;gap:8px}.chip{cursor:default}.rij b{display:block;margin-bottom:8px}.rij ul{margin:0;padding-left:20px}.rij li{padding:2px 0}
#log .bot{font-size:20px;font-weight:700;letter-spacing:-.015em;line-height:1.35}#log .link{word-break:break-all;text-decoration:underline;text-underline-offset:3px}
#pills{padding:18px 0 0;display:flex;flex-wrap:wrap;gap:10px}#pills:empty{padding:0}
.pill,#typ input,#typ button{font:inherit;border:1px solid var(--ink);border-radius:999px;padding:10px 20px;line-height:1.3;min-height:46px}
.pill{background:#fff;color:var(--ink);cursor:pointer;text-align:left;display:inline-flex;align-items:center}.pill:hover{text-decoration:none}
.pill.aan,.pill.door,#typ button{background:var(--ink);color:#fff;cursor:pointer}
#typ{display:flex;gap:10px;padding:22px 0 0}#typ input{flex:1;min-width:0;background:#fff;color:var(--ink)}#typ input::placeholder{color:var(--ink);opacity:.5}#typ input:focus{outline:0;box-shadow:0 0 0 1px var(--ink)}#typ button{white-space:nowrap}
.meer{margin:72px 0 0;border-top:1px solid var(--line);padding-top:22px}.meer a{display:block;padding:4px 0}
footer{border-top:1px solid var(--line);margin-top:72px}footer div{max-width:680px;margin:0 auto;padding:18px 26px 26px;font-size:13px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media(max-width:640px){.top-in{padding:16px 18px}main{padding:28px 18px 0}#kort{margin-bottom:32px}#log .bot{font-size:18px}}`;

// kind: 'buyers' | 'owners' | null (voordeur met rolkeuze). links: [{href, tekst}] voor de voordeur.
export function renderChatPage(taal, kind, { gscMeta, growthScript = '', links = [] } = {}) {
  const C = LPT[taal], X = TEKST[taal]; if (!C || !X) return null;
  const P = kind ? { title: C[kind].title, desc: C[kind].desc, eyebrow: C[kind].eyebrow, h1: C[kind].h1, kort: KORT[kind][taal] } : HUB[taal];
  const pad = t => kind ? '/' + t + '/' + LP[kind][t] : '/' + t, canon = BASE + pad(taal), index = !kind || LP_INDEX;
  const alts = Object.keys(LPT).map(t => `<link rel="alternate" hreflang="${t}" href="${BASE + pad(t)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${kind ? BASE + pad('en') : BASE + '/'}">`;
  const talen = Object.keys(LPT).map(t => `<a href="${pad(t)}" hreflang="${t}"${t === taal ? ' aria-current="page"' : ''}>${t.toUpperCase()}</a>`).join('');
  const ld = kind ? '' : `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', '@id': BASE + '/#org', name: 'Sealed Intent', url: BASE + '/', logo: BASE + '/icon-512.png' }, { '@type': 'WebSite', '@id': BASE + '/#site', name: 'Sealed Intent', url: BASE + '/', publisher: { '@id': BASE + '/#org' } }, { '@type': 'WebPage', url: canon, name: P.title, description: P.desc, inLanguage: taal, isPartOf: { '@id': BASE + '/#site' } }] }).replace(/</g, '\\u003c')}</script>`;
  const cfg = JSON.stringify({ taal, rol: kind || '', T: X, meet: MEET }).replace(/</g, '\\u003c');
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(P.title)}</title><meta name="description" content="${esc(P.desc)}"><link rel="canonical" href="${canon}">${alts}${index ? '' : '<meta name="robots" content="noindex, follow">'}${gscMeta ? `<meta name="google-site-verification" content="${esc(gscMeta)}">` : ''}<meta property="og:title" content="${esc(P.h1)}"><meta property="og:description" content="${esc(P.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${BASE}/icon-512.png"><link rel="icon" href="/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#ffffff"><style>${CSS}</style>${ld}</head><body>
<header><div class="top-in"><a class="brand" href="/${taal}">${zegel(26)}<span>sealed<span>intent</span></span></a><nav class="langs" aria-label="Language">${talen}</nav></div></header>
<main><h1>${esc(P.h1)}</h1><p id="kort">${esc(P.kort)}</p>
<section aria-label="Chat"><div id="log" aria-live="polite"><div id="som"></div></div><div id="pills"></div><form id="typ" autocomplete="off"><input name="t" type="text" maxlength="200" placeholder="${esc(X.ph)}" aria-label="${esc(X.ph)}"><button type="submit">${esc(X.stuur)} <span aria-hidden="true">→</span></button></form></section>
<noscript><p><a href="/${taal}/seal">${esc(C.owners.cta)}</a></p></noscript>
${links.length ? `<nav class="meer" aria-label="${esc(X.meer)}">${links.map(l => `<a href="${esc(l.href)}">${esc(l.tekst)}</a>`).join('')}</nav>` : ''}</main>
<footer><div><span>${esc(C.foot)}</span><a href="/${taal}/${C.privacySlug}">${esc(C.privacy)}</a></div></footer>
<script>(${chatBrowser.toString()})(${cfg});</script>${growthScript}</body></html>`;
}
