// todayin surgery: de huisstijl van outname.now, één op één doorgetrokken (Henkjan 17 nov 2026: "Kijk naar outname.now en trek
// dat 100% door"). Bron van de maten: outname.now/styles.css en reply-flow.css. Alleen de accentkleur wijkt af: kliniekgroen.
// Deze laag komt als laatste in elke pagina en gaat over alles wat er in de bouw bij kwam.
// De maten (niets erbij verzinnen): tekst 17, inleiding 18, klein 14, label 12, kop 29, tussenkop 16, paginatitel tot 54 (home) of 44.
// Kleuren: koppen --ink, tekst --body, bijzaak --muted, lijnen --line, één accent. Kaarten: rand 1px, hoek 16. Velden en knoppen
// in een formulier: hoek 9, hoogte 48. Losse knoppen en keuzeknopjes: rond. Links: accentkleur zonder streep, streep bij aanwijzen.
export const ACCENT = '#0F7B5F';
export const LOOK_CSS = `
:root{--ink:#111113;--body:#3A3F47;--muted:#6B7280;--zacht:#6B7280;--line:#E5E7EB;--line2:#B9BFC7;--acc:${ACCENT};--acc2:#E8F4EE;--bg:#fff;--sr-hover:#FAFBFA}
@media (prefers-color-scheme:dark){:root{--ink:#F2F3F5;--body:#C9CDD3;--muted:#8B929B;--zacht:#8B929B;--line:#272C37;--line2:#4A5260;--acc:#71CF9E;--acc2:#16301F;--bg:#0F1116;--sr-hover:#141821}}
html{scroll-behavior:smooth;scroll-padding-top:100px}
body{font-size:17px;line-height:1.6;color:var(--body);-webkit-font-smoothing:antialiased}
header{border-bottom:1px solid var(--line)}
header .wrap,.choice-wide header .wrap{max-width:1040px;padding:0 26px;min-height:66px}
.mark{font-size:20px;letter-spacing:-.02em;color:var(--ink);text-decoration:none!important}.mark em{color:var(--acc)}
.tl{gap:2px}.tl a{color:var(--muted);font-size:13px;font-weight:600;padding:4px 6px;border-radius:6px;margin:0;text-decoration:none!important;background:none}
.tl a:hover{color:var(--ink);background:var(--acc2)}.tl a[aria-current]{color:var(--acc);background:none}
.wrap,.choice-wide .wrap,.choice-wide footer .wrap,footer .wrap{max-width:820px;padding-left:26px;padding-right:26px}
main,.choice-wide main{padding:56px 0 30px}
h1,.s-choice h1{font-size:clamp(32px,5.4vw,44px)!important;line-height:1.1!important;letter-spacing:-.035em!important;color:var(--ink);margin:0 0 22px!important;max-width:750px;text-wrap:balance;font-weight:700}
html[data-slug=""] h1,html[data-slug="nl"] h1,html[data-slug="de"] h1{font-size:clamp(35px,5.9vw,54px)!important;line-height:1.09!important;letter-spacing:-.04em!important}
h2,.pv h2,.s-choice h2,.sr-cohort h2,.sd-context>h2,.sd-preview h2{font-size:29px!important;line-height:1.22!important;letter-spacing:-.03em!important;color:var(--ink);font-weight:700;margin:72px 0 15px!important;text-wrap:balance}
h3,h4,.s-choice h3,.s-choice h4,.sr-card h3,.sr-topicgroups>section h3{font-size:16px!important;line-height:1.6;color:var(--ink);font-weight:600;letter-spacing:0}
p{margin:0 0 14px}
p,li,td,th,dd,dt{font-size:17px}
h1+p,.sr-lead{font-size:18px!important;line-height:1.7;color:var(--body)!important;max-width:650px;margin:0 0 28px!important}
strong,b{color:var(--ink);font-weight:600}
a,main a,.s-choice a,.sr-sources a,.mf-value a,footer a{color:var(--acc);text-decoration:none}
a:hover,main a:hover{text-decoration:underline;text-underline-offset:3px}
sup{font-size:11px;line-height:0;vertical-align:baseline;position:relative;top:-.5em;margin-left:2px}sup a{font-weight:600}
ul,ol{padding-left:20px}li{margin:6px 0}
.sr-muted,.meta,.com,.sr-note,.sr-stats,.cp-scope,.mf-label,.mail .mf-heading p:last-child,.sr-card>p,.sr-card details p,.sr-card details li,.sr-sources,.sr-sources a,.tp-head p,.cp-dialog>p,.bron,.bron li,.mf-learn p,.mf-learn strong,.sr-table small,.sr-staff li span,.sr-topics li>span{font-size:14px!important;line-height:1.7;color:var(--muted)!important;font-weight:400}
.klein,.sr-breadcrumb,.sr-breadcrumb a,.mf label,.sr-filters label,.s-choice label,.tp-field>label,.mail .mf-consent,.mail .mf-consent a,.sr-index>span,.sr-list-note,.cp-group,.cp-dialog .cp-foot,.cp-dialog .cp-options>button>small,footer,footer .wrap,.choice-wide footer,.sr-index strong small,.sr-table thead th,.sr-table caption{font-size:12px!important;line-height:1.65;color:var(--muted)!important;font-weight:400;letter-spacing:0}
.sr-breadcrumb{margin:0 0 24px}.sr-breadcrumb a:hover{color:var(--ink)!important}
.sr-table thead th{font-weight:600;font-size:13px!important}
.sr-list-note{display:none}
.sr-lead:has(+ #samenvatting){display:none}

.b,main a.b{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px!important;background:var(--acc);color:#fff!important;font-size:15px!important;font-weight:600;line-height:1.3;min-height:48px;padding:12px 22px;text-decoration:none!important;white-space:nowrap}
@media (prefers-color-scheme:dark){.b,main a.b{color:#0B1022!important}}
.b:disabled,.b[disabled],.b[aria-disabled=true]{opacity:.5;cursor:default}
.mf .b,.cf .b,.tp-foot .b,.calc .b{border-radius:9px!important}
input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,.mf input:not([type=hidden]),.mf select,.tp-trigger,.cp-trigger,#sr-search,.cf input,.calc input,.calc select{border-radius:9px!important;border:1px solid var(--line2)!important;padding:10px 16px!important;min-height:48px;font-size:16px!important;background-color:var(--bg);color:var(--ink);box-shadow:none}
input:focus,select:focus,.tp-trigger:focus-visible,.cp-trigger:focus-visible,button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--acc)!important;outline-offset:2px!important}
.tp-trigger svg,.cp-trigger svg{color:var(--muted)}

.mail,.chat,.calc,.sd-preview,.cp-empty{background:var(--bg)!important;border:1px solid var(--line)!important;border-radius:16px!important;box-shadow:0 5px 22px #15214b04;padding:22px!important;margin:0 0 18px!important}
.mail .mf-heading{margin:0 0 16px}
.mail h2,.pv .mail h2,.s-choice .mail h2,.chat h2,.calc h2,.sd-preview h2{font-size:16px!important;line-height:1.6!important;letter-spacing:0!important;font-weight:600;margin:0 0 2px!important}
.mail .mf{gap:14px}
.mf label,.tp-field>label{display:block;margin:0 0 7px!important}
.mail .mf-consent a{color:var(--acc)!important}
.answer+.meta{margin:0 0 28px}
.mf-more summary,.sr-context summary,.sr-unranked>summary,.sr-staff>summary,.sr-card details>summary{font-size:14px!important;font-weight:500;color:var(--acc)!important;min-height:0;padding:0}
.mf-more{margin-top:2px}
.mf-stages button{border-radius:9px!important;border:1px solid var(--line);font-size:14px!important;color:var(--body)}
.mf-stages button[aria-checked=true]{border-color:var(--acc);color:var(--acc);background:var(--acc2)}
.chips{gap:8px;margin:10px 0 14px}
.chips button,.sr-category-tabs button,.tp-categories button{border-radius:999px!important;border:1px solid var(--line)!important;background:var(--bg);color:var(--body);font-size:13px!important;font-weight:500;padding:6px 13px;min-height:34px}
.chips button:hover,.sr-category-tabs button:hover,.tp-categories button:hover{border-color:var(--acc)!important;color:var(--ink)}
.sr-category-tabs button[aria-pressed=true],.tp-categories button[aria-pressed=true]{background:var(--acc2)!important;border-color:var(--acc2)!important;color:var(--acc)!important;font-weight:600}
.log .k{background:var(--acc2);border-radius:10px;padding:14px 18px;color:var(--ink)}
.cf{gap:10px}

.answer,.pv .answer,.calc .out{background:var(--acc2);border:0;border-radius:16px;padding:22px 24px;margin:18px 0 22px;color:var(--ink)}
.answer p{font-size:17px;line-height:1.6;color:var(--ink)}
#samenvatting{background:none;padding:0;margin:0 0 28px;border-radius:0;color:var(--body)}
#samenvatting p{margin:0 0 10px;color:var(--body)}

.sr-stats{margin:18px 0 0}
.sr-tabs{background:none;border:0;padding:0;gap:8px;border-radius:0;width:auto;justify-content:flex-start;margin:40px 0 14px}
.sr-tabs a,.sr-tabs a:first-child{border:1px solid var(--line);border-radius:999px;background:none;box-shadow:none;padding:6px 13px;min-height:34px;font-size:13px!important;font-weight:500;color:var(--body)!important;text-decoration:none!important}
.sr-tabs a:hover{border-color:var(--acc);background:none}
.sr-filters{gap:14px;margin:18px 0 10px}
.sr-cohort h2{margin:48px 0 16px!important;font-size:29px!important}
.sr-cohort h2 .sr-muted{background:none;padding:0;min-width:0;height:auto;font-size:14px!important;font-weight:400}
.sr-ranked{border:1px solid var(--line);border-radius:16px;box-shadow:0 14px 38px #17274406}
.sr-card{padding:20px 24px;border-radius:0}
.sr-card:hover{background:var(--sr-hover)}
.sr-card h3 a{color:var(--ink)!important}.sr-card h3 a:hover{color:var(--acc)!important;text-decoration:none}
.sr-position{background:none;color:var(--muted)!important;font-size:13px!important;font-weight:600;width:auto;min-height:0;place-items:start;padding-top:3px}
.sr-index strong{font-size:26px!important;font-weight:700;letter-spacing:-.02em;color:var(--ink)}
.sr-topicgroups{column-gap:15px}
.sr-topicgroups>section{border:1px solid var(--line);border-radius:14px;padding:22px 22px 14px;margin:0 0 15px}
.sr-topicgroups>section h3:before{width:7px;height:7px;background:var(--acc)}
.sr-topics a{font-size:14px!important;color:var(--body)!important;min-height:42px}
.sr-topics a:hover{color:var(--acc)!important;text-decoration:none}
.sr-topics a span{background:none;color:var(--muted);font-size:13px;min-width:0;height:auto}
.sr-links{gap:0 26px}
.sr-links li{padding:14px 0;border-bottom:1px solid var(--line)}
.sr-links a{font-size:15px!important;font-weight:500}
.cards{gap:15px}.cards li{border:1px solid var(--line);border-radius:14px;padding:22px}.cards a{font-weight:600;font-size:16px}
.sr-table{border:0;border-radius:0;margin:18px 0}
.sr-table table{font-size:15px}
.sr-table th,.sr-table td{padding:14px 12px;border-bottom:1px solid var(--line);font-size:15px}
.sr-table thead{background:none}
.sr-table tbody th,.sr-table td:first-child{color:var(--ink);font-weight:600}
details{border-top:1px solid var(--line);padding:16px 0}details:last-of-type{border-bottom:1px solid var(--line)}
summary{font-size:15px;line-height:1.7;font-weight:600;color:var(--ink)}
details p,details li{font-size:14px;line-height:1.8;color:var(--muted)}
.mf-more,.sr-context,.sr-card details,.mf-more:last-of-type,.sr-context:last-of-type,.sr-card details:last-of-type{border:0;padding:0}
.sr-card details{margin-top:12px}.sr-card details[open]{border-top:1px solid var(--line);padding-top:14px;margin-top:16px}
footer{border-top:1px solid var(--line);margin-top:56px;padding:22px 0 40px}
@media(max-width:640px){header .wrap,.choice-wide header .wrap{padding:0 20px;min-height:58px}.wrap,.choice-wide .wrap,footer .wrap{padding-left:20px;padding-right:20px}main,.choice-wide main{padding:38px 0 20px}h1,.s-choice h1{font-size:34px!important;letter-spacing:-.03em!important}html[data-slug=""] h1,html[data-slug="nl"] h1,html[data-slug="de"] h1{font-size:38px!important}h1+p,.sr-lead{font-size:16px!important}h2,.pv h2,.s-choice h2,.sr-cohort h2{font-size:25px!important;margin-top:56px!important}.mail,.chat,.calc{padding:18px!important}.mf .b,.cf .b{width:100%}.sr-card{padding:18px 16px}.sr-card>p{font-size:13px!important}.answer{padding:18px}}
`;
// De keuzevensters (ingrepen, landen): zelfde stijl. Eén zoekveld, rijen met een lijn, geen soortnaam per rij, geen gekleurde rondjes.
export const LOOK_DIALOG_CSS = `
.tp-dialog,.cp-dialog{border-radius:16px;border:1px solid var(--line);box-shadow:0 14px 38px #17274420;color:var(--body)}
.tp-dialog::backdrop,.cp-dialog::backdrop{background:#11111366;backdrop-filter:none}
.tp-head{padding:24px 24px 16px}
.tp-head h2,.cp-head h2,.s-choice .cp-head h2{font-size:20px!important;line-height:1.3!important;letter-spacing:-.02em!important;margin:0 0 4px!important}
.tp-close,.cp-close{background:none!important;color:var(--muted)!important;border:0!important;border-radius:6px!important;width:36px;min-width:36px;height:36px;font-size:24px!important;padding:0!important;min-height:0}
.tp-close:hover,.cp-close:hover{color:var(--ink)!important;background:var(--acc2)!important}
.tp-find{border:1px solid var(--line2);border-radius:9px;padding:0 14px;margin:0 24px}
.tp-find:focus-within{border-color:var(--acc)}
.tp-find svg{color:var(--muted)}
.tp-dialog .tp-find input[type=search]:not([type=hidden]):not([type=checkbox]):not([type=radio]){border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;padding:0!important;min-height:46px;background:transparent}
.tp-categories{gap:8px;margin-top:14px;padding:0 24px 10px}
.tp-options{padding:0 24px 12px}
.tp-options ul{gap:0 26px}
.tp-options button{border:0!important;border-bottom:1px solid var(--line)!important;border-radius:0!important;min-height:50px;padding:12px 0;background:none!important}
.tp-options strong{font-weight:400;font-size:15px!important;color:var(--body)}
.tp-options button:hover strong{color:var(--ink)}
.tp-options button[aria-pressed=true] strong{font-weight:600;color:var(--acc)}
.tp-options small{display:none}
.tp-mark{background:none!important;color:var(--muted)!important;width:auto;height:auto;font-size:18px;border-radius:0}
.tp-options button[aria-pressed=true] .tp-mark{color:var(--acc)!important}
.tp-foot{padding:16px 24px}
.tp-foot #tp-count{font-size:14px!important;font-weight:600;color:var(--ink)}
.tp-foot #tp-clear{font-size:14px!important;color:var(--muted)!important;text-decoration:none}
.tp-foot #tp-clear:hover{color:var(--ink)!important;text-decoration:underline}
.cp-dialog .cp-options>button{border-radius:9px;font-size:15px;color:var(--body)}
.cp-dialog .cp-options>button[aria-selected=true]{background:var(--acc2);color:var(--acc);border-color:transparent}
@media(max-width:600px){.tp-dialog,.cp-dialog{border-radius:16px 16px 0 0}.tp-head{padding:20px 20px 14px}.tp-find{margin:0 20px}.tp-categories{padding:0 20px 10px}.tp-options{padding:0 20px 10px}.tp-foot{padding:14px 20px calc(14px + env(safe-area-inset-bottom))}}
`;
