// Huisstijl van alle keuzehulpen: één bron (18 nov 2026). Henkjan: "pak outname.now en gebruik dat design", "1 kleur . doe hier maar zwart overal van
// sealedintent.com en niet zulke rare blob slop" en "ALLE bestaande keuzehulpen ALLEMAAL echt consistent". Elke keuzehulppagina (keuzehulp.best en
// zijn onderdelen zorgverzekering en rotterdam, whichtobuy.best, kaufberater.best, nexy.help, de rekenhulpen) laadt HUISSTIJL_CSS als laatste stylesheet,
// zodat oude regels van een sjabloon nooit winnen. De keuring (lib/keuring.js, dagelijks) controleert dat elke pagina hem heeft.
// Regels: één kleur (zwart #111113, grijs #6B7280 voor bijzaken, lopende tekst #3A3F47, lijnen #E5E7EB, vlak #F3F4F6); geen blauw; knoppen zwart en rond;
// pills met een dunne rand (gekozen = zwart met witte tekst); secties zonder kaders; blokjes met een dunne rand; lijsten met pijltjes; voet in één regel.
import { measureTag } from './kleur.js';
import { kzuxBlok } from './kzux.js';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const kortZin = (t, n) => { t = String(t || '').replace(/\s*[—–]\s*/g, ', ').replace(/\s+/g, ' ').trim(); if (t.length <= n) return t; return t.slice(0, n).replace(/\s\S*$/, '') + '…'; };
export const ovKaart = (href, eb, titel, sub, meer) => `<a class="card ov-k" href="${esc(href)}">${eb ? `<span class="e">${esc(eb)}</span>` : ''}<b>${esc(titel)}</b>${sub ? `<span class="s">${esc(kortZin(sub, 120))}</span>` : ''}${meer ? `<span class="m">${esc(meer)} →</span>` : ''}</a>`;
export const ovRegel = (href, titel) => `<a class="card ov-r" href="${esc(href)}">${esc(titel)}<span aria-hidden="true">→</span></a>`;
export const ovPil = (href, label, aan) => `<a class="card ov-c${aan ? ' on' : ''}" href="${esc(href)}">${esc(label)}</a>`;

const Z = '#111113', G = '#6B7280', T = '#3A3F47', L = '#E5E7EB', V = '#F3F4F6', R = '#D1D5DB';
const CSS = [
  // basis voor elke pagina, ook sjablonen zonder .ov (zorg, rotterdam, nexy.help, rekenhulpen)
  `:root{--acc:${Z}!important;--acc-2:${V}!important;--acc2:${V}!important;--accent:${Z}!important;--accent-soft:${V}!important;--accent-ink:#fff!important;--on-acc:#fff!important}`,
  `body{color:${T}}h1,h2,h3,h4{color:${Z}}.mark,.mark em,.brand,.brand span{color:${Z}!important}.mark em,.brand span{font-weight:400;font-style:normal!important}h1,h2,h3,h4,.mark{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important}h1{letter-spacing:-.035em}`,
  `main a{color:${Z}}main a:not(.card):not(.btn):not(.cta):not([class^=kx]):not(.tegel):hover{text-decoration:underline!important;text-underline-offset:3px}`,
  `main .btn,main a.btn,main .cta,main a.cta,main button.btn,main button[type=submit]:not(#kxf button):not(.kx-f button){background:${Z}!important;border-color:${Z}!important;color:#fff!important;box-shadow:none!important;border-radius:999px!important}main .btn.ghost,main .btn.sec{background:#fff!important;color:${Z}!important}`,
  `main .tegel:hover,main .card:hover{border-color:${Z}!important}main .chips a,main .pill,main .pills li{background:#fff!important;color:${Z}!important;border:1px solid ${R}!important}main .chips a:hover{border-color:${Z}!important}`,
  `main .answer,main .qbox,main .vak{background:${V}!important}main .pr.best{border-color:${L}!important}main *:focus-visible{outline:2px solid ${Z}!important;outline-offset:2px}`,
  `main a[style*="2B47C4"]:not([style*="background"]),main span[style*="2B47C4"],main p[style*="2B47C4"],main b[style*="2B47C4"],main [style*="color:#2B47C4"],main [style*="color: #2B47C4"]{color:${Z}!important}main [style*="border-color:#2B47C4"],main [style*="border:1px solid #2B47C4"]{border-color:${L}!important}`,
  // kop: dezelfde balk op elk sjabloon (vaste waarden, zodat ook sjablonen zonder lookNieuw hem goed tonen)
  `body{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}header.topbar{position:sticky;top:0;z-index:5;border-bottom:1px solid ${L};background:#fff}header.topbar .wrap{max-width:1040px;margin:0 auto;padding:0 18px;display:flex;align-items:center;gap:18px;min-height:64px;flex-wrap:wrap}header.topbar .mark{font-weight:700;font-size:20px;letter-spacing:-.02em;color:${Z}!important;text-decoration:none}header.topbar .topnav{margin-left:auto;display:flex;flex-wrap:wrap;gap:12px 18px;font-size:16px}header.topbar .topnav a{color:${Z}!important;text-decoration:none;background:none!important;border:0!important;padding:0!important}header.topbar .topnav a:hover{text-decoration:underline!important;text-underline-offset:3px}@media(max-width:560px){header.topbar .topnav{font-size:15px;gap:10px 14px}}`,
  `.ov p.kicker,.ov .hero p.kicker,main p.kicker{font-size:11px!important;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:${G}!important}`,
  // overzichten en keuzehulppagina's (.ov)
  `.ov{color:${T}}.ov .crumbs{margin:0 0 26px!important}.ov-eb,.ov .hero p.ov-eb{font-size:11px!important;letter-spacing:1.4px;text-transform:uppercase;font-weight:600;color:${G}!important;display:flex;align-items:center;gap:9px;margin:0 0 18px;line-height:1.4;max-width:none}.ov .hero p.ov-eb{margin:22px 0 18px!important}.ov-eb i{width:7px;height:7px;border-radius:50%;background:${Z};display:inline-block}`,
  `.ov h1{font-size:clamp(35px,5.9vw,54px)!important;letter-spacing:-2.1px;line-height:1.09;margin:0 0 14px!important;max-width:750px;color:${Z}}.ov p.kz-meta{font-size:14px!important;margin:0 0 22px!important}.ov p.ov-lead{font-size:18px;line-height:1.7;color:${T};max-width:650px;margin:0 0 30px}`,
  `.ov .kx{border:1px solid ${L};border-radius:16px;padding:22px;box-shadow:0 5px 22px #15214b06;margin:0 0 8px}`,
  `.ov h2.ov-h{font-size:11px!important;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;color:${G}!important;margin:64px 0 16px!important;line-height:1.4}`,
  `.ov-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.ov-g.twee{grid-template-columns:repeat(2,minmax(0,1fr))}`,
  `.ov a.card.ov-k{padding:20px 20px 18px;gap:6px;border-radius:14px;border:1px solid ${L};color:${T}!important;text-decoration:none!important}.ov a.card.ov-k:hover{border-color:${Z}!important}.ov-k .e{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;color:${G}}.ov-k b{font-size:17px;line-height:1.35;color:${Z};font-weight:600;letter-spacing:-.01em}.ov-k .s{font-size:14px;line-height:1.7;color:${G}}.ov-k .m{margin-top:auto;padding-top:10px;font-size:14px;font-weight:500;color:${Z}}`,
  `.ov a.card.ov-r{display:flex;flex-direction:row;justify-content:space-between;align-items:baseline;gap:16px;border:0;border-top:1px solid ${L};border-radius:0;padding:16px 0;font-weight:600;font-size:16px;color:${Z}!important;text-decoration:none!important;background:none}.ov a.card.ov-r:last-child{border-bottom:1px solid ${L}}.ov a.card.ov-r span{color:${Z};font-weight:500}.ov a.card.ov-r:hover{text-decoration:underline!important;text-underline-offset:3px}`,
  `.ov-cs{display:flex;flex-wrap:wrap;gap:8px}.ov a.card.ov-c{display:inline-block;border:1px solid ${L};border-radius:999px;padding:8px 15px;font-size:14px;font-weight:500;line-height:1.3;color:${Z}!important;text-decoration:none!important}.ov a.card.ov-c:hover,.ov a.card.ov-c.on{border-color:${Z}!important}`,
  `.ov-f{font-size:14px;line-height:1.7;color:${G};margin:18px 0 0}.ov .txt a:not(.card),.ov .ov-f a,.ov details a,.ov td a{text-decoration:underline!important;text-underline-offset:3px;text-decoration-color:#B9BFC7!important}`,
  `body:has(.ov-lijst) #choice-updates{display:none!important}.ov h2.ov-h2{font-size:29px!important;letter-spacing:-.9px;line-height:1.22;color:${Z};margin:0 0 18px!important}.ov [class*=decision],.ov [class*=koop],.ov .adv>div{border-color:${L}!important}`,
  // keuzehulppagina (.ov.gids)
  `.ov.gids .hero{padding:0}.ov .answer{border-radius:16px;padding:22px 24px;margin:8px 0 0;border:0}.ov .answer p{font-size:17px;line-height:1.7;color:${Z}}.ov .answer .kicker{font-size:10px;letter-spacing:1.5px;color:${G}}`,
  `.ov .q{border:0!important;padding:0!important;margin:30px 0 0!important;box-shadow:none!important;background:none!important}.ov .q h2{display:flex;align-items:center;gap:12px;font-size:16px!important;letter-spacing:-.01em;margin:0 0 12px!important;color:${Z};font-weight:600}.ov .q .qn{flex:none;width:30px;height:30px;border:1px solid ${L};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${Z}}.ov .q .opts{padding-left:0;gap:8px}.ov .q:has(.qn) .opts{padding-left:42px}`,
  `.ov .opt{border-radius:999px;font-size:15px;min-height:42px;padding:9px 16px;border:1px solid ${R};color:${Z};background:#fff}.ov .opt:hover{border-color:${Z}!important;color:${Z}!important}.ov .opt.on,.ov .opt.on:hover,.ov .opt.on:focus{background:${Z}!important;border-color:${Z}!important;color:#fff!important;font-weight:500}.ov .opt:focus{outline:none!important;box-shadow:none!important}`,
  `.ov .txt,.ov .box{border:0!important;padding:0!important;margin:64px 0 0;background:none!important;box-shadow:none!important;border-radius:0}.ov .txt h2,.ov .box h2,.ov .adv>h2,.ov.gids>h2{font-size:22px!important;letter-spacing:-.5px;color:${Z}!important;margin:0 0 14px!important;font-weight:700}.ov.gids>h2{margin-top:56px!important}.ov .txt p,.ov .txt li{font-size:16px;line-height:1.75;color:${T}}.ov .txt h3{font-size:16px!important;color:${Z}}`,
  `.ov .adv{margin:48px 0 0}.ov .pr{border:1px solid ${L}!important;border-radius:14px;padding:16px;gap:16px}.ov .pr .t{font-size:17px;line-height:1.35;color:${Z}}.ov .pr .role{font-size:10px;letter-spacing:1.5px;color:${G};opacity:1}.ov .pr .m{font-size:15px;color:${T}}.ov .pr .btn{font-size:14px;padding:10px 18px}`,
  `.ov .disc,.ov p.disc{font-size:13px;line-height:1.6;color:${G};opacity:1}.ov table{font-size:15px}.ov th{color:${G};font-weight:600;font-size:13px}.ov details.faq summary{font-size:16px;color:${Z}}.ov details.faq p{font-size:15px;line-height:1.75;color:${T}}.ov .rel{font-size:15px;color:${G}}`,
  // tabel in een met de hand geschreven sectie (item.secties in api/kz.js), 18 nov 2026
  `.ov table.kz-tabel{width:100%;border-collapse:collapse;margin:16px 0 0}.ov table.kz-tabel th,.ov table.kz-tabel td{text-align:left;padding:10px 12px 10px 0;border-bottom:1px solid ${L};vertical-align:top}.ov table.kz-tabel td{font-size:15px;color:${Z}}.ov p.mut{font-size:13px;color:${G};margin-top:8px}`,
  `.ov .guide-actions button{font:inherit;font-size:14px;border:1px solid ${R};background:#fff;color:${Z};border-radius:999px;padding:7px 14px;cursor:pointer}`,
  // chat (lib/kzux.js) en aanmeldblok onderaan (lib/keuze-updates-client.js): zelfde ronde balk
  `.kx-ps button:hover,.kx-cp button:hover,.kx-act button:hover,.kx-act a:hover,.kx-vb:hover,a.kx-r:hover .kx-k{border-color:${Z}!important;color:${Z}!important}form.kx-f button,#kxf button{background:${Z}!important;color:#fff!important}form.kx-f:focus-within{border-color:${Z}!important}`,
  `#choice-updates{border:0!important;border-top:1px solid ${L}!important;border-radius:0!important;box-shadow:none!important;background:none!important;padding:28px 0 0!important;margin:64px 0 0!important}#choice-updates h2,#choice-updates h3{font-size:20px!important;letter-spacing:-.4px;color:${Z};margin:0 0 6px!important}#choice-updates p{font-size:15px!important;line-height:1.6;color:${T}}#choice-updates a{font-size:13px;color:${G}!important}`,
  `#choice-updates form{display:flex!important;flex-wrap:nowrap!important;align-items:center;gap:6px!important;border:1.5px solid rgba(127,127,127,.45)!important;border-radius:999px!important;padding:5px 5px 5px 18px!important;max-width:560px;background:#fff!important;box-shadow:none!important;margin:14px 0 10px!important}#choice-updates form:focus-within{border-color:${Z}!important}#choice-updates form input{flex:1 1 auto!important;min-width:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;padding:8px 0!important;min-height:0!important;height:auto!important;background:transparent!important;font-size:16px!important;outline:0}#choice-updates form button,#choice-updates .btn{flex:none;background:${Z}!important;border:0!important;color:#fff!important;border-radius:999px!important;min-height:42px!important;height:42px;padding:0 20px!important;font-size:15px!important;font-weight:600;white-space:nowrap}`,
  // /verzekeringen (lib/verzekeringen-view.js, eigen klassen ins-*): groen en goud naar zwart en grijs
  `body:has(.ins-hero){background:#fff!important;color:${T}!important}.ins-hero{background:#fff!important;color:${T}!important;padding-left:0!important;padding-right:0!important}.ins-hero h1,.ins-hero h2{color:${Z}!important}.ins-kicker,.ins-meta,.ins-stat span,.ins-muted,.ins-new-card small,.ins-policy-table small,.ins-sources{color:${G}!important}.ins-hero .lead{color:${T}!important}.ins-hero a{color:${Z}!important;text-decoration:underline;text-decoration-color:#B9BFC7}.ins-stat strong,.ins-new-card strong,.ins-policy-detail summary,.ins-dialog,main a.ins-link,.ins-main a:not(.ins-button){color:${Z}!important}.ins-stats,.ins-new-card,.ins-toolbar,.ins-chapter,.ins-scroll,.ins-sources,.ins-faq,.ins-review,.ins-policy-table th,.ins-policy-table td,.ins-compare-table th,.ins-compare-table td,.ins-matrix th,.ins-matrix td{border-color:${L}!important}.ins-toolbar input,.ins-toolbar select{border-color:${R}!important}.ins-answer{border-left:3px solid ${Z}!important}.ins-note,.ins-new,.ins-check,.ins-selection-message,.ins-policy-table caption,.ins-compare-table caption,.ins-compare-table th,.ins-matrix th{background:${V}!important;border-color:${L}!important;color:${Z}!important}.ins-policy-table thead th{background:${Z}!important;color:#fff!important}.ins-pill{background:#fff!important;color:${Z}!important;border:1px solid ${R}!important;border-radius:999px!important}.ins-pill[aria-pressed=true]{background:${Z}!important;border-color:${Z}!important;color:#fff!important}.ins-tag,.ins-tag.old{background:${V}!important;color:${Z}!important}.ins-tag.old{color:${G}!important}.ins-button{background:${Z}!important;border:1px solid ${Z}!important;color:#fff!important;border-radius:999px!important}.ins-button.secondary{background:#fff!important;color:${Z}!important;border-color:${R}!important}.ins-button[aria-pressed=true]{background:${Z}!important;color:#fff!important;border-color:${Z}!important}.ins-tray{background:${Z}!important}.ins-tray small{color:${R}!important}.ins-tray .ins-button{background:#fff!important;color:${Z}!important;border-color:#fff!important}.ins-dialog::backdrop{background:#111113b8!important}`,
  // voet in één regel
  `footer.voet1{margin:72px 0 0;padding:20px 0 36px;font-size:13px;line-height:1.6;color:${G};border-top:1px solid ${L}}footer.voet1 a{color:${G};text-decoration:none}footer.voet1 a:hover{color:${Z}!important;text-decoration:underline}`,
  // telefoon
  `@media(max-width:760px){.ov-g{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.ov-g,.ov-g.twee{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ov a.card.ov-k{padding:14px 14px 12px}.ov-k .s{display:none}.ov-k b{font-size:15px}.ov-k .e{font-size:9px;letter-spacing:1px}.ov h1{font-size:38px!important;letter-spacing:-1.5px}.ov p.ov-lead{font-size:16px}.ov .kx{padding:16px}.ov h2.ov-h{margin-top:48px!important}}`
].join('');
export const FAVICON = "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Crect%20width%3D%2764%27%20height%3D%2764%27%20rx%3D%2714%27%20fill%3D%27%23111113%27%2F%3E%3Cpath%20d%3D%27M18%2033l9%209%2019-20%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-width%3D%277%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%2F%3E%3C%2Fsvg%3E";
export const HUISSTIJL_CSS = '<style data-huisstijl="1">' + CSS + '</style>';
// Voet in één regel per site: alleen wat nodig is (wie, over, privacy, vergoeding); kaufberater met de verplichte Impressum-gegevens in dezelfde regel.
export function voetEenRegel(site, extra) {
  const x = extra ? ' · ' + extra : '';
  if (site === 'us') return '<footer class="voet1"><div class="wrap"><a href="/">Which To Buy</a> · independent, brands cannot buy a spot · <a href="/about">About</a> · <a href="/privacy">Privacy</a> · <a href="/privacy#opt-out">Do Not Sell or Share My Personal Information</a> · As an Amazon Associate we earn from qualifying purchases; your price stays the same. · Also in <a href="https://kaufberater.best/" hreflang="de" lang="de">Germany</a> and <a href="https://keuzehulp.best/" hreflang="nl" lang="nl">the Netherlands</a>' + x + '</div></footer>';
  if (site === 'de') return '<footer class="voet1"><div class="wrap"><a href="/">Kaufberater</a> · unabhängig, Marken können keinen Platz kaufen · <a href="/about">Impressum und über uns</a> · <a href="/privacy">Datenschutz</a> · AdsFair B.V., Albert Plesmanplein 20, 2805 AB Gouda, Niederlande, KvK 60126035 · Als Amazon-Partner verdienen wir an qualifizierten Verkäufen; dein Preis bleibt gleich. · Auch in den <a href="https://whichtobuy.best/" hreflang="en" lang="en">USA</a> und den <a href="https://keuzehulp.best/" hreflang="nl" lang="nl">Niederlanden</a>' + x + '</div></footer>';
  if (site === 'nexy') return '<footer class="voet1"><div class="wrap"><a href="/">nexy.help</a> · independent AI tool guide · <a href="https://keuzehulp.best/keuzehulp/privacy">Privacy</a> · Some links are affiliate links; your price stays the same.' + x + '</div></footer>';
  return '<footer class="voet1"><div class="wrap"><a href="https://keuzehulp.best/">Keuzehulp</a> · onafhankelijk, merken kopen geen plek · <a href="https://keuzehulp.best/keuzehulp/over">Over ons</a> · <a href="https://keuzehulp.best/keuzehulp/privacy">Privacy</a> · <a href="https://keuzehulp.best/zorgverzekering">Zorgverzekering</a> · <a href="https://keuzehulp.best/rotterdam">Rotterdam</a> · <a href="https://wa.me/31655395630" rel="nofollow">WhatsApp</a> · Koop je via onze link, dan krijgen wij een vergoeding. Jouw prijs blijft gelijk. · Ook in de <a href="https://whichtobuy.best/" hreflang="en" lang="en">VS</a> en <a href="https://kaufberater.best/" hreflang="de" lang="de">Duitsland</a>' + x + '</div></footer>';
}

// Eén keer over de hele pagina, voor sjablonen met een eigen opbouw (zorg, rotterdam, nexy.help, rekenhulpen, verzekeringen, cadeauhulp):
// zwart icoon, dezelfde kop, voet in één regel (verplichte bronvermelding blijft in die regel), geen modal, en de huisstijl als laatste stylesheet.
const MERK = { nl: ['https://keuzehulp.best/', 'keuze<em>hulp</em>'], us: ['/', 'which<em>to</em>buy'], de: ['/', 'kauf<em>berater</em>'], nexy: ['/', 'nexy<em>.help</em>'] };
export function huisstijlPagina(html, site, o) {
  html = String(html || ''); o = o || {}; site = site || 'nl';
  if (!/<\/body>/i.test(html) || /data-huisstijl="1"/.test(html)) return html;
  html = html.replace(/<link rel="icon"[^>]*>/i, '<link rel="icon" type="image/svg+xml" href="' + FAVICON + '">');
  const mk = MERK[site] || MERK.nl, hs = html.search(/<header[\s>]/i);
  if (hs >= 0) { const he = html.indexOf('</header>', hs); if (he > hs) {
    const kop = html.slice(hs, he), nav = (kop.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i) || [])[1] || '';
    const links = (nav.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || []).map(x => x.replace(/\s(class|style)="[^"]*"/g, '')).join('');
    const std = site === 'nl' ? '<a href="https://keuzehulp.best/">Alle keuzehulpen</a><a href="https://keuzehulp.best/deals">Deals</a><a href="https://keuzehulp.best/keuzehulp/over">Over ons</a>' : '';
    html = html.slice(0, hs) + '<header class="topbar"><div class="wrap"><a class="mark" href="' + mk[0] + '">' + mk[1] + '</a><nav class="topnav" aria-label="Menu">' + (links || std) + '</nav></div></header>' + html.slice(he + 9);
  } }
  const voet = voetEenRegel(site, o.voetExtra);
  const i = html.lastIndexOf('<footer');
  if (i >= 0) { const j = html.indexOf('</footer>', i); if (j > i) html = html.slice(0, i) + voet + html.slice(j + 9); }
  else html = html.replace(/<\/main>/i, '</main>' + voet);
  if (!/class="ov[ "]/.test(html)) html = html.replace(/(<main\b[^>]*>)/i, '$1<div class="ov">').replace(/<\/main>/i, '</div></main>');
  html = html.replace(/<script src="\/cm\.js"(?![^>]*data-modal)/g, '<script src="/cm.js" data-modal="geen"');
  // Zelfde werking en meting op elk sjabloon (18 nov 2026, Henkjan: "Alle keuzehulpen moeten hetzelfde werken en moeten hetzelfde leren"):
  // chat met de vragen van de pagina, Clickmind-meting zonder modal, bezoekteller per bron en per groep (lib/kleur.js measureTag).
  if (o.chat && !/class="kx[ "]/.test(html)) html = chatErin(html, site, o);
  const cmSite = { nl: 'keuzehulp', us: 'whichtobuy', de: 'kaufberater' }[site];
  if (cmSite && !/src="\/cm\.js"/.test(html)) html = html.replace(/<\/head>/i, '<script src="/cm.js" data-site="' + cmSite + '" data-proef="' + cmSite + '-' + String((o.meet && o.meet.G) || 'los') + '" data-modal="geen" async></script></head>');
  if (o.meet && html.indexOf("'-hv-'+d") < 0) html = html.replace(/<\/body>/i, measureTag(o.meet.P, o.meet.klik || 'a[rel~="nofollow"],a[data-out],a[data-t],a.btn[href^="http"]', '.kx-ps button,#kxf button,form button,.opt', o.meet.G) + '</body>');
  return html.replace(/<\/body>/i, HUISSTIJL_CSS + '</body>');
}
// De chat van de keuzehulpen (lib/kzux.js) op een sjabloon dat hem nog niet heeft: vragen en antwoorden uit de FAQ van de pagina zelf
// (details/summary of FAQPage in de JSON-LD), onder de inleiding of op de plek die het sjabloon aangeeft (o.chat.voor: tekst waar hij vóór komt).
const TXT = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|’/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
function paginaFaq(html) {
  const uit = [];
  for (const m of html.matchAll(/"@type":"Question","name":"((?:[^"\\]|\\.)*)","acceptedAnswer":\{"@type":"Answer","text":"((?:[^"\\]|\\.)*)"/g)) { try { uit.push({ q: JSON.parse('"' + m[1] + '"'), a: JSON.parse('"' + m[2] + '"') }); } catch (e) {} }
  if (!uit.length) for (const m of html.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)) { const q = TXT(m[1]), a = TXT(m[2]); if (q.length > 8 && /\?$/.test(q) && a.length > 20) uit.push({ q, a: a.slice(0, 600) }); }
  return uit.filter((x, i, a) => a.findIndex(y => y.q === x.q) === i).slice(0, 12);
}
// ALLES heeft de chat (Henkjan 18 nov 2026: "ALLES MoET een chat hebben en die chat is centraal dus alle ingangen voor een leer lus"): ook sjablonen buiten metHuisstijl (shell van api/kz.js, cadeauhulp) zetten hem erin.
export function chatErbij(html, site, o) { try { return /class="kx[ "]/.test(html) ? html : chatErin(html, site, Object.assign({ chat: true }, o || {})); } catch (e) { return html; } }
function chatErin(html, site, o) {
  const c = o.chat === true ? {} : o.chat, taal = site === 'de' ? 'de' : site === 'nl' ? 'nl' : 'us';
  const h1 = TXT((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || '');
  const kop = { nl: 'Vraag het de keuzehulp', de: 'Frag den Kaufberater', us: 'Ask the guide' }[taal];
  const blok = kzuxBlok({ alleenChat: true, kop, taal, site: 'kzux' + String((o.meet && o.meet.G) || 'los') + (taal === 'nl' ? '' : taal), slug: c.slug || String((o.meet && o.meet.G) || 'los'), term: c.term || (t => t.charAt(0).toLowerCase() + t.slice(1))(h1.replace(/[?:].*$/, '').trim().slice(0, 60)), shop: '', prods: [], opties: [], faq: paginaFaq(html) });
  if (c.voor && html.indexOf(c.voor) > 0) { const k = html.indexOf(c.voor); return html.slice(0, k) + blok + html.slice(k); }
  const e = html.search(/<\/h1>/i); if (e < 0) return html;
  const na = html.slice(e), lead = na.match(/^<\/h1>(\s*<(p|div)\b[^>]*>[\s\S]*?<\/\2>){0,2}/i); const k = e + (lead ? lead[0].length : 5);
  return html.slice(0, k) + blok + html.slice(k);
}
// Voor een handler: elke HTML-respons gaat door huisstijlPagina, zonder dat elk sjabloon het zelf hoeft te doen.
export function metHuisstijl(res, site, o) {
  const send = res.send.bind(res);
  res.send = b => { try { const ct = String(res.getHeader && res.getHeader('content-type') || ''); if (typeof b === 'string' && (/html/.test(ct) || /^\s*<!doctype html/i.test(b))) b = huisstijlPagina(b, typeof site === 'function' ? site() : site, typeof o === 'function' ? o() : o); } catch (e) {} return send(b); };
  return res;
}
