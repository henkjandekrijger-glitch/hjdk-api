// HTML van de verlanglijst: één opmaak (telefoon eerst, nooit grijze tekst), de schil per scherm en de mails.
import crypto from 'node:crypto';
import { T, TALEN, TAALNAAM, tt } from './taal.js';
import { klant } from './klant.js';

export const APP_JS = '(' + klant.toString() + ')();';
export const VERSIE = crypto.createHash('sha1').update(APP_JS).digest('hex').slice(0, 8);
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const veiligJson = o => JSON.stringify(o).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');

export const CSS = `:root{--ink:#111113;--acc:#2B47C4;--acc2:#EEF1FC;--line:#E3E6EE;--ok:#1F7A4D;--okbg:#E7F4EC;--warm:#FFF1D6;--r:16px;color-scheme:light}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%}body{margin:0;background:#fff;color:var(--ink);font:400 17px/1.5 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--acc)}button{-webkit-tap-highlight-color:transparent}
.top{position:sticky;top:0;z-index:20;background:#fff;border-bottom:1px solid var(--line)}.top .in{max-width:620px;margin:0 auto;padding:0 16px;height:56px;display:flex;align-items:center;gap:10px}
.merk{font-weight:800;font-size:21px;letter-spacing:-.03em;color:var(--ink);text-decoration:none;display:flex;align-items:baseline;gap:8px}.merk b{color:var(--acc)}.merk small{font-weight:600;font-size:15px;letter-spacing:0}
.taal{margin-left:auto;border:1px solid var(--line);border-radius:999px;background:#fff;font:inherit;font-size:14px;padding:6px 10px;color:var(--ink);max-width:130px}
main{max-width:620px;margin:0 auto;padding:18px 16px 32px;min-height:60vh}
h1{font-size:31px;line-height:1.12;letter-spacing:-.035em;margin:6px 0 10px;font-weight:800;text-wrap:balance}h2{font-size:20px;line-height:1.25;letter-spacing:-.02em;margin:0 0 8px;font-weight:750}
p{margin:0 0 12px}.sub{font-size:18px;margin:0 0 18px}.note{font-size:15px;background:var(--warm);border-radius:12px;padding:8px 12px;margin:0 0 14px}.klein{font-size:14px}
.kaart{border:1px solid var(--line);border-radius:var(--r);padding:16px;margin:0 0 14px;background:#fff}.kaart.blauw{background:var(--acc2);border-color:transparent}
.veld{display:block;width:100%;min-width:0;min-height:50px;border:1.5px solid #C5CBD8;border-radius:12px;padding:12px 14px;font:inherit;font-size:17px;color:var(--ink);background:#fff;-webkit-appearance:none;appearance:none}
.veld:focus{outline:none;border-color:var(--acc);box-shadow:0 0 0 3px #C9D2F5}textarea.veld{min-height:96px;resize:vertical;line-height:1.45}select.veld{padding-right:30px;background-image:linear-gradient(45deg,transparent 50%,#111113 50%),linear-gradient(135deg,#111113 50%,transparent 50%);background-position:calc(100% - 17px) 50%,calc(100% - 12px) 50%;background-size:5px 5px;background-repeat:no-repeat}
.lb{display:block;font-weight:650;font-size:15px;margin:12px 0 6px}
.k,.k2{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:11px 18px;border-radius:999px;border:1.5px solid var(--acc);background:var(--acc);color:#fff;font:inherit;font-weight:700;font-size:16px;cursor:pointer;text-decoration:none;text-align:center;line-height:1.2}
.k2{background:#fff;color:var(--acc)}.vol{display:flex;width:100%}.k:disabled,.k2:disabled{opacity:.6;cursor:default}
.k3{background:none;border:0;color:var(--acc);font:inherit;font-weight:650;font-size:15px;padding:8px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
.klein-k{min-height:40px;padding:7px 14px;font-size:15px}
.rij{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.rij.nw{flex-wrap:nowrap}.rij.nw .veld{flex:1}.rij.meer{gap:14px;margin-top:4px}
.chips{display:flex;gap:8px;flex-wrap:wrap}.chip{border:1.5px solid #C5CBD8;background:#fff;border-radius:999px;padding:9px 14px;font:inherit;font-size:15px;cursor:pointer;color:var(--ink);min-height:42px}.chip.aan{background:var(--acc);border-color:var(--acc);color:#fff;font-weight:650}
.it{display:grid;grid-template-columns:84px minmax(0,1fr);gap:12px;padding:14px 0;border-top:1px solid var(--line)}.kaart>.it:first-child{padding-top:0;border-top:0}.kaart>.it:last-child{padding-bottom:0}
.fo{width:84px;height:84px;border-radius:12px;background:var(--acc2);display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--acc)}.fo img{width:100%;height:100%;object-fit:contain;background:#fff}
.tt{font-weight:650;font-size:17px;line-height:1.3;margin:0 0 3px;overflow-wrap:anywhere}.pr{font-size:15px;margin:0 0 8px}.pr b{font-size:17px}
.it.bezet .fo{opacity:.4}.it.bezet .tt{text-decoration:line-through;text-decoration-thickness:1px}.bezetlabel{display:inline-block;background:var(--acc2);border-radius:999px;padding:4px 12px;font-size:14px;font-weight:650;margin:0 0 6px}
.fav{display:inline-block;background:var(--warm);border-radius:999px;padding:2px 9px;font-size:13px;font-weight:700;margin:0 0 4px}
.okbg{background:var(--okbg);border-radius:12px;padding:8px 12px;font-weight:650;font-size:15px;color:var(--ok);margin:0 0 8px}
.mini{margin:8px 0 4px}.mini .veld{min-height:46px}.pot{border:1px solid var(--line);border-radius:14px;padding:12px;margin:4px 0 8px}
.balk{height:10px;background:var(--acc2);border-radius:99px;overflow:hidden;margin:8px 0 6px}.balk i{display:block;height:100%;background:var(--acc);border-radius:99px}
.kdalt{display:flex;flex-direction:column;gap:2px;margin:8px 0 0;padding:10px 12px;border-radius:12px;background:var(--acc2);text-decoration:none;color:var(--ink);font-size:14px}.kdalt b{font-size:15px}
.kdrij{display:grid;grid-template-columns:84px minmax(0,1fr);gap:12px;padding:12px 0;border-top:1px solid var(--line);text-decoration:none;color:var(--ink)}.kdrij:first-of-type{border-top:0}
.idee{padding:12px 0;border-top:1px solid var(--line)}.idee:first-of-type{border-top:0}.idee .rij{gap:16px}
.ul{margin:0 0 6px;padding-left:20px}.ul li{margin:4px 0}
.stappen{counter-reset:s;list-style:none;padding:0;margin:4px 0 18px}.stappen li{counter-increment:s;display:grid;grid-template-columns:32px 1fr;gap:10px;margin:0 0 10px;align-items:start}.stappen li:before{content:counter(s);width:28px;height:28px;border-radius:50%;background:var(--acc);color:#fff;font-weight:800;font-size:15px;display:flex;align-items:center;justify-content:center}
.tegels{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 14px}.tegel{display:block;border:1px solid var(--line);border-radius:var(--r);padding:14px;text-decoration:none;color:var(--ink)}.tegel b{display:block;font-size:17px;margin:0 0 4px;color:var(--acc)}.tegel span{font-size:14px}
.twee{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end}.potrij{display:grid;gap:8px}.naamkop{display:grid;grid-template-columns:minmax(0,1fr) 128px;gap:8px;font-size:14px;font-weight:650;margin:0 0 4px}
.naamrij{display:grid;grid-template-columns:minmax(0,1fr) 128px;gap:8px;margin:0 0 8px}.naamrij select{font-size:15px}
.lidrij{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line)}.lidrij>div:first-child{flex:1;min-width:0}.lidrij .rij{flex-wrap:nowrap;gap:12px}.lidrij:first-of-type{border-top:0}
.lot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;min-height:180px;border:0;border-radius:22px;background:linear-gradient(135deg,#2B47C4,#5A6FE6);color:#fff;font:inherit;font-size:19px;font-weight:700;cursor:pointer;margin:0 0 14px;padding:20px;text-align:center}
.lot svg{width:44px;height:44px}.lot.open{cursor:default}.lot .nm{font-size:44px;font-weight:800;letter-spacing:-.03em;line-height:1.1;animation:op .7s cubic-bezier(.2,1.4,.4,1)}@keyframes op{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.gedicht{white-space:pre-wrap;background:var(--warm);border-radius:14px;padding:14px 16px;margin:12px 0 4px;font-size:17px;line-height:1.55}
.modal{position:fixed;inset:0;background:rgba(17,17,19,.45);z-index:50;display:flex;align-items:flex-end;justify-content:center}.modal .doos{background:#fff;width:100%;max-width:620px;border-radius:22px 22px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom))}
.keus{display:grid;gap:10px;margin:14px 0 8px}.keus button{min-height:92px;border-radius:18px;border:0;font:inherit;font-size:20px;font-weight:750;cursor:pointer;color:var(--ink)}
.melding{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom));transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 18px;border-radius:999px;font-size:15px;z-index:60;max-width:92vw;text-align:center}
.seo{margin:26px 0 0;padding:18px 0 0;border-top:1px solid var(--line)}.seo h2{margin:18px 0 8px}.seo h3{font-size:17px;margin:14px 0 4px}.verberg{display:none!important}.voet{max-width:620px;margin:0 auto;padding:18px 16px 36px;font-size:14px;border-top:1px solid var(--line)}.voet p{margin:0 0 8px}.voet .rij{gap:16px;margin:0 0 10px}
@media(max-width:360px){h1{font-size:27px}.tegels{grid-template-columns:1fr}.naamrij,.naamkop{grid-template-columns:minmax(0,1fr) 110px}}`;

const ICO = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2B47C4"/><path d="M8 14h16v11H8zM6 10h20v4H6zM16 10v15" stroke="#fff" stroke-width="2.4" fill="none"/></svg>');
const ADRES = 'https://gids.kadoly.com';

// o: { taal, titel, beschrijving, view, data, index, pad, ogImg, ssr, basis, bronnen, bronnaam }
export function schil(o) {
  const t = T[o.taal] || T.en; const basis = o.basis || '/w';
  const url = x => ADRES + o.pad + (x === 'nl' ? '' : '?taal=' + x); // Nederlands op het kale adres (ook x-default), andere talen met ?taal=
  const alt = o.index && o.pad != null ? TALEN.map(x => `<link rel="alternate" hreflang="${x}" href="${url(x)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${url('nl')}"><link rel="canonical" href="${url(o.taal)}">` : '';
  const opties = TALEN.map(x => `<option value="${x}"${x === o.taal ? ' selected' : ''}>${TAALNAAM[x]}</option>`).join('');
  return `<!doctype html><html lang="${o.taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.titel)}</title><meta name="description" content="${esc(o.beschrijving || t.sub)}">${o.index ? '' : '<meta name="robots" content="noindex,nofollow">'}${alt}
<meta property="og:title" content="${esc(o.titel)}"><meta property="og:description" content="${esc(o.beschrijving || t.sub)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Kadoly">${o.ogImg ? `<meta property="og:image" content="${esc(o.ogImg)}">` : ''}
<meta name="theme-color" content="#ffffff"><meta name="referrer" content="strict-origin-when-cross-origin"><link rel="icon" href="${ICO}">${o.ld || ''}<style>${CSS}</style></head><body>
<header class="top"><div class="in"><a class="merk" href="${basis}"><span>Kad<b>o</b>ly</span><small>${esc(t.naam_product)}</small></a><select class="taal" aria-label="${esc(t.taal)}" onchange="var u=new URL(location.href);u.searchParams.set('taal',this.value);location.href=u.href">${opties}</select></div></header>
<main><div id="app">${o.ssr || ''}</div>${o.na || ''}</main>
<footer class="voet"><div class="rij"><a href="${basis}">${esc(t.naam_product)}</a><a href="${basis}/lootjes">${esc(t.t_lootjes)}</a><a href="${basis}/zoek">${esc(t.t_zoek)}</a><a href="${basis}/gedicht">${esc(t.t_ged)}</a></div><p>${esc(t.privacy)}</p><p>${esc(t.aff)}</p><p>${esc(t.voet)}</p></footer>
<script>window.WL=${veiligJson({ taal: o.taal, t, basis, view: o.view, data: o.data || null, bronnen: o.bronnen || [], bronnaam: o.bronnaam || {} })}</script><script src="${basis}/app.js?v=${VERSIE}" defer></script></body></html>`;
}

// eenvoudige mail in de stijl van de pagina; taal = die van de ontvanger
export function mailHtml({ taal, kop, tekst, knop, href, extra, afUrl }) {
  const t = T[taal] || T.en; const k = 'background:#2B47C4;color:#ffffff;text-decoration:none;font-weight:700;border-radius:999px;padding:13px 22px;display:inline-block';
  return `<!doctype html><html lang="${taal}"><body style="margin:0;background:#ffffff;color:#111113;font:16px/1.55 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:24px 18px"><p style="font-weight:800;font-size:20px;letter-spacing:-.02em;margin:0 0 18px">Kad<span style="color:#2B47C4">o</span>ly</p>
<h1 style="font-size:23px;line-height:1.25;margin:0 0 12px">${esc(kop)}</h1><p style="margin:0 0 18px">${esc(tekst)}</p>
${href ? `<p style="margin:0 0 20px"><a href="${esc(href)}" style="${k}">${esc(knop)}</a></p>` : ''}${extra || ''}
<hr style="border:0;border-top:1px solid #E3E6EE;margin:26px 0 14px"><p style="font-size:13px;margin:0 0 6px">${esc(t.m_af)}${afUrl ? ` <a href="${esc(afUrl)}" style="color:#2B47C4">${esc(t.m_af_link)}</a>` : ''}</p><p style="font-size:13px;margin:0">${esc(t.voet)}</p></div></body></html>`;
}
export const mailTekst = ({ taal, kop, tekst, knop, href, afUrl }) => [kop, '', tekst, '', href ? knop + ': ' + href : '', '', tt(taal, 'm_af') + (afUrl ? ' ' + tt(taal, 'm_af_link') + ': ' + afUrl : ''), tt(taal, 'voet')].join('\n');
