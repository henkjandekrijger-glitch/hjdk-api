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
const CSS = `:root{--ink:#111113;--line:#E5E7EB;--line2:#B9BFC7;--accent:#111113;--soft:#F3F4F6}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%}
body{margin:0;background:#fff;color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:17px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--ink)}a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.top{border-bottom:1px solid var(--line)}.top-in{max-width:1040px;margin:0 auto;padding:18px 26px;display:flex;align-items:center;gap:20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.02em;text-decoration:none;color:var(--ink);--bg:#fff}.brand svg{color:var(--ink)}.brand span span{font-weight:400}
.langs{margin-left:auto;display:flex;gap:2px;font-size:13px;font-weight:400}.langs a{text-decoration:none;padding:4px 7px;border-radius:4px}.langs a:hover{background:var(--soft)}.langs a[aria-current]{font-weight:700}
main{max-width:720px;margin:0 auto;padding:56px 26px 0}
.eye{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin:0 0 18px;display:flex;align-items:center;gap:10px}.dot{width:7px;height:7px;background:var(--accent);border-radius:50%;flex:none}
h1{font-size:clamp(30px,5vw,44px);line-height:1.1;letter-spacing:-.035em;font-weight:700;margin:0 0 14px;text-wrap:balance}
.kort{margin:0 0 30px}
.chat{border:1px solid var(--line);border-radius:16px;box-shadow:0 5px 22px rgba(17,17,19,.04);overflow:hidden}
#log{padding:24px 24px 6px;display:flex;flex-direction:column;gap:12px;min-height:96px}#log p{margin:0}
#log .bot{font-size:20px;font-weight:600;letter-spacing:-.015em;line-height:1.4;max-width:92%}
#log .ik{align-self:flex-end;background:var(--soft);border-radius:20px;padding:7px 16px;max-width:86%}
#log .klein{font-size:13px}#log .link{font-size:17px;word-break:break-all;font-weight:600;color:var(--ink);text-underline-offset:3px}
#pills{padding:14px 24px 20px;display:flex;flex-wrap:wrap;gap:10px}
.pill{font:inherit;background:#fff;color:var(--ink);border:1px solid var(--ink);border-radius:999px;padding:10px 18px;cursor:pointer;text-decoration:none;line-height:1.3;text-align:left}.pill:hover{background:var(--soft)}.pill.aan{background:var(--ink);color:#fff}.pill.door{border-color:transparent;font-weight:700;padding-left:8px}.pill.door:hover{background:none;text-decoration:underline}
#typ{display:flex;gap:12px;border-top:1px solid var(--line);padding:18px 22px;background:#fff}#typ input{flex:1;min-width:0;min-height:48px;font:inherit;font-size:16px;border:1px solid var(--line2);border-radius:999px;padding:10px 20px;color:var(--ink);background:#fff}#typ input::placeholder{color:#6B7280}#typ input:focus{outline:0;border-color:var(--ink);box-shadow:0 0 0 1px var(--ink)}#typ button{min-height:48px;font:inherit;font-size:15px;font-weight:600;background:var(--ink);color:#fff;border:0;border-radius:999px;padding:12px 24px;cursor:pointer;white-space:nowrap}#typ button:hover{opacity:.85}
.meer{margin:56px 0 0;border-top:1px solid var(--line);padding-top:22px}.meer b{display:block;font-size:13px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}.meer a{display:block;text-decoration:none;padding:5px 0}.meer a:hover{text-decoration:underline}
footer{border-top:1px solid var(--line);margin-top:64px}footer div{max-width:720px;margin:0 auto;padding:18px 26px 26px;font-size:13px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}footer a{text-decoration:none}footer a:hover{text-decoration:underline}
@media(max-width:640px){.top-in{padding:14px 18px}main{padding:32px 16px 0}#log{padding:18px 16px 4px}#log .bot{font-size:18px}#pills{padding:12px 16px 16px}#typ{padding:14px 16px}.pill{padding:10px 16px}}`;

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
<header class="top"><div class="top-in"><a class="brand" href="/${taal}">${zegel(26)}<span>sealed<span>intent</span></span></a><nav class="langs" aria-label="Language">${talen}</nav></div></header>
<main><p class="eye"><span class="dot" aria-hidden="true"></span>${esc(P.eyebrow)}</p><h1>${esc(P.h1)}</h1><p class="kort">${esc(P.kort)}</p>
<section class="chat" aria-label="Chat"><div id="log" aria-live="polite"></div><div id="pills"></div><form id="typ" autocomplete="off"><input name="t" type="text" maxlength="200" placeholder="${esc(X.ph)}" aria-label="${esc(X.ph)}"><button type="submit">${esc(X.stuur)} <span aria-hidden="true">→</span></button></form></section>
<noscript><p><a href="/${taal}/seal">${esc(C.owners.cta)}</a></p></noscript>
${links.length ? `<nav class="meer" aria-label="${esc(X.meer)}"><b>${esc(X.meer)}</b>${links.map(l => `<a href="${esc(l.href)}">${esc(l.tekst)}</a>`).join('')}</nav>` : ''}</main>
<footer><div><span>${esc(C.foot)}</span><a href="/${taal}/${C.privacySlug}">${esc(C.privacy)}</a></div></footer>
<script>(${chatBrowser.toString()})(${cfg});</script>${growthScript}</body></html>`;
}
