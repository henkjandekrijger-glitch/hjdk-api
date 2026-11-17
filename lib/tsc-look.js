// todayin surgery: de huisstijl van outname.now, één op één (Henkjan 17 nov 2026: "Outname.now is alles rond en ander lettertype
// en andere groottes, nu gewoon doen"). Bron: outname.now/styles.css, de basis van die site. Alleen het accent wijkt af: kliniekgroen.
// Deze laag komt als laatste in elke pagina. De maten van outname, niets erbij verzinnen: tekst 17, inleiding 19, klein 14,
// label 15 vet, kop 24, tussenkop 18, paginatitel tot 44. Alles rond: velden en knoppen 999px, kaarten en vlakken 14px.
// Koppen --ink, tekst --body, bijzaak --muted. Aanmeldblok = het scanformulier van outname: zacht groen vlak, ronde velden van 52 hoog.
export const ACCENT = '#0F7B5F';
export const LOOK_CSS = `
:root{--ink:#111113;--body:#3A3F47;--muted:#6B7280;--zacht:#6B7280;--line:#E5E7EB;--line2:#B9BFC7;--acc:${ACCENT};--acc2:#E8F4EE;--bg:#fff;--sr-hover:#FAFBFA}
@media (prefers-color-scheme:dark){:root{--ink:#F2F3F5;--body:#C9CDD3;--muted:#8B929B;--zacht:#8B929B;--line:#272C37;--line2:#4A5260;--acc:#71CF9E;--acc2:#16301F;--bg:#0F1116;--sr-hover:#141821}}
html{-webkit-text-size-adjust:100%}
body,button,input,select,textarea,.tp-dialog,.cp-dialog{font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif!important}
body{font-size:17px;line-height:1.6;color:var(--body);-webkit-font-smoothing:antialiased}
header{border-bottom:1px solid var(--line)}
header .wrap,.choice-wide header .wrap{max-width:1080px;padding:16px 20px;min-height:0}
.mark{font-size:20px;font-weight:700;letter-spacing:-.02em;color:var(--ink);text-decoration:none!important}.mark em{color:var(--acc)}
.tl{gap:2px}.tl a{color:var(--muted);font-size:13px;font-weight:600;padding:4px 6px;border-radius:6px;margin:0;text-decoration:none!important;background:none}
.tl a:hover{color:var(--ink);background:var(--acc2)}.tl a[aria-current]{color:var(--acc);background:none}
.wrap,.choice-wide .wrap,.choice-wide footer .wrap,footer .wrap{max-width:800px;padding-left:20px;padding-right:20px}
main,.choice-wide main{padding:28px 0 56px}
h1,.s-choice h1{font-size:clamp(30px,5.4vw,44px)!important;line-height:1.12!important;letter-spacing:-.03em!important;color:var(--ink);margin:6px 0 14px!important;max-width:none;text-wrap:balance;font-weight:700}
h2,.pv h2,.s-choice h2,.sr-cohort h2,.sd-context>h2,.sd-preview h2{font-size:24px!important;line-height:1.3!important;letter-spacing:-.02em!important;color:var(--ink);font-weight:700;margin:40px 0 10px!important;text-wrap:balance}
h3,h4,.s-choice h3,.s-choice h4,.sr-card h3,.sr-topicgroups>section h3{font-size:18px!important;line-height:1.35;color:var(--ink);font-weight:600;letter-spacing:0}
p{margin:0 0 14px}
p,li,td,th,dd,dt{font-size:17px}
h1+p,.sr-lead{font-size:19px!important;line-height:1.6;color:var(--body)!important;max-width:62ch;margin:0 0 14px!important}
strong,b{color:var(--ink);font-weight:600}
a,main a,.s-choice a,.sr-sources a,.mf-value a{color:var(--acc)}
sup{font-size:12px;line-height:0;vertical-align:baseline;position:relative;top:-.5em;margin-left:2px}sup a{font-weight:600;text-decoration:none}
ul,ol{padding-left:20px}li{margin:4px 0}
.sr-muted,.meta,.com,.sr-note,.sr-stats,.cp-scope,.mf-label,.mail .mf-heading p:last-child,.sr-card>p,.sr-card details p,.sr-card details li,.sr-sources,.sr-sources a,.tp-head p,.cp-dialog>p,.bron,.bron li,.mf-learn p,.mf-learn strong,.sr-table small,.sr-staff li span,.sr-topics li>span,.klein,.mail .mf-consent,.mail .mf-consent a,.sr-list-note,.cp-dialog .cp-foot,footer,footer .wrap,.choice-wide footer,.sr-breadcrumb,.sr-breadcrumb a{font-size:14px!important;line-height:1.5;color:var(--muted)!important;font-weight:400;letter-spacing:0}
.mail .mf-consent,.mail .mf-heading p:last-child,.micro{color:var(--body)!important}
.mail .mf-consent a,.sr-sources a{color:var(--acc)!important}
.sr-index>span,.cp-group,.cp-dialog .cp-options>button>small,.sr-index strong small,.sr-table thead th,.sr-table caption,.sr-position{font-size:13px!important;line-height:1.4;color:var(--muted)!important;font-weight:600;letter-spacing:0}
.sr-index>span,.sr-index strong small,.cp-dialog .cp-options>button>small{font-weight:400}
.mf label,.sr-filters label,.s-choice label,.tp-field>label{display:block;font-size:15px!important;font-weight:600;color:var(--ink)!important;margin:0 0 6px!important;line-height:1.4}
.sr-breadcrumb{margin:0 0 6px}.sr-breadcrumb a{text-decoration:none}
.sr-list-note{display:none}
.sr-lead:has(+ #samenvatting){display:none}

.b,main a.b{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:999px!important;background:var(--acc);color:#fff!important;font-size:17px!important;font-weight:600;line-height:1.3;min-height:52px;padding:13px 24px;text-decoration:none!important;white-space:nowrap}
@media (prefers-color-scheme:dark){.b,main a.b{color:#0B1022!important}}
.b:disabled,.b[disabled],.b[aria-disabled=true]{opacity:.5;cursor:default}
input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,.mf input:not([type=hidden]),.mf select,.tp-trigger,.cp-trigger,#sr-search,.cf input,.calc input,.calc select{border-radius:999px!important;border:1px solid var(--line2)!important;padding:10px 18px!important;min-height:52px;font-size:16px!important;background-color:var(--bg);color:var(--ink);box-shadow:none}
input:focus,select:focus,.tp-trigger:focus-visible,.cp-trigger:focus-visible,button:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--acc)!important;outline-offset:2px!important}
.tp-trigger svg,.cp-trigger svg{color:var(--muted)}

.mail{background:var(--acc2)!important;border:0!important;border-radius:14px!important;box-shadow:none;padding:18px 20px!important;margin:18px 0 22px!important}
.chat,.calc,.sd-preview,.cp-empty{background:var(--bg)!important;border:1px solid var(--line)!important;border-radius:14px!important;box-shadow:none;padding:18px 22px!important;margin:0 0 14px!important}
.mail .mf-heading{margin:0 0 12px}
.mail h2,.pv .mail h2,.s-choice .mail h2,.chat h2,.calc h2,.sd-preview h2{font-size:18px!important;line-height:1.35!important;letter-spacing:0!important;font-weight:600;margin:0 0 4px!important}
.mail .mf{gap:12px}
.mf-submit{max-width:none!important}.mf .b{padding:13px 22px}
.answer+.meta{margin:0 0 22px}
.mf-more summary,.sr-context summary,.sr-unranked>summary,.sr-staff>summary,.sr-card details>summary{font-size:15px!important;font-weight:600;color:var(--ink)!important;min-height:0;padding:0}
.mf-stages button{border-radius:999px!important;border:1px solid var(--line2);font-size:14px!important;color:var(--body);padding:8px 14px}
.mf-stages button[aria-checked=true]{border-color:var(--acc);color:var(--acc);background:var(--bg)}
.chips{gap:10px;margin:8px 0 14px}
.chips button,.sr-category-tabs button,.tp-categories button,.sr-tabs a,.sr-tabs a:first-child{border-radius:999px!important;border:0!important;background:var(--acc2)!important;color:var(--ink)!important;font-size:14px!important;font-weight:600;padding:6px 14px;min-height:36px;box-shadow:none;text-decoration:none!important}
.chips button:hover,.sr-category-tabs button:hover,.tp-categories button:hover,.sr-tabs a:hover{color:var(--acc)!important}
.sr-category-tabs button[aria-pressed=true],.tp-categories button[aria-pressed=true]{background:var(--acc)!important;color:#fff!important}
@media (prefers-color-scheme:dark){.sr-category-tabs button[aria-pressed=true],.tp-categories button[aria-pressed=true]{color:#0B1022!important}}
.log .k{background:var(--acc2);border-radius:14px;padding:14px 18px;color:var(--ink)}
.cf{gap:12px}

.answer,.pv .answer,.calc .out{background:var(--acc2);border:0;border-radius:14px;padding:14px 18px;margin:8px 0 14px;color:var(--ink)}
.answer p{font-size:17px;line-height:1.5;color:var(--ink)}
#samenvatting{background:none;padding:0;margin:0 0 14px;border-radius:0;color:var(--body)}
#samenvatting p{margin:0 0 10px;color:var(--body)}

.sr-stats{margin:14px 0 0}
.sr-tabs{background:none;border:0;padding:0;gap:10px;border-radius:0;width:auto;justify-content:flex-start;margin:28px 0 14px}
.sr-filters{gap:12px;margin:18px 0 10px}
.sr-cohort h2{margin:40px 0 12px!important}
.sr-cohort h2 .sr-muted{background:none;padding:0;min-width:0;height:auto;font-size:14px!important;font-weight:400}
.sr-ranked{border:1px solid var(--line);border-radius:14px;box-shadow:none}
.sr-card{padding:14px 22px;border-radius:0}
.sr-card:hover{background:var(--sr-hover)}
.sr-card h3 a{color:var(--ink)!important;text-decoration:none}.sr-card h3 a:hover{color:var(--acc)!important}
.sr-position{background:none;width:auto;min-height:0;place-items:start;padding-top:4px}
.sr-index strong{font-size:26px!important;font-weight:700;letter-spacing:-.02em;color:var(--ink);line-height:1.2}
.sr-topicgroups{column-gap:14px}
.sr-topicgroups>section{border:1px solid var(--line);border-radius:14px;padding:18px 22px 10px;margin:0 0 14px}
.sr-topicgroups>section h3:before{width:6px;height:6px;background:var(--acc)}
.sr-topics a{font-size:15px!important;overflow-wrap:normal;hyphens:auto;color:var(--body)!important;min-height:44px;text-decoration:none}
.sr-topics a:hover{color:var(--acc)!important}
.sr-topics a span{background:var(--acc2);color:var(--acc);font-size:13px;font-weight:600;border-radius:999px;min-width:0;height:auto;padding:3px 10px}
.sr-links{gap:0 24px}
.sr-links li{padding:14px 0;border-bottom:0;border-top:1px solid var(--line)}
.sr-links a{font-size:17px!important;font-weight:600;color:var(--ink)!important;text-decoration:none}.sr-links a:hover{color:var(--acc)!important}
.cards{gap:14px}.cards li{border:1px solid var(--line);border-radius:14px;padding:18px 22px}.cards a{font-weight:600;font-size:17px;color:var(--ink);text-decoration:none}
.sr-table{border:0;border-radius:0;margin:18px 0}
.sr-table table{font-size:15px}
.sr-table th,.sr-table td{padding:10px 12px;border-bottom:1px solid var(--line);font-size:15px}
.sr-table thead{background:none}
.sr-table tbody th,.sr-table td:first-child{color:var(--ink);font-weight:600}
details{border-top:1px solid var(--line);padding:12px 0}details:last-of-type{border-bottom:1px solid var(--line)}
summary{font-size:17px;font-weight:600;color:var(--ink)}
details p{margin:8px 0 0}
.mf-more,.sr-context,.sr-card details,.mf-more:last-of-type,.sr-context:last-of-type,.sr-card details:last-of-type{border:0;padding:0}
.sr-card details{margin-top:10px}.sr-card details[open]{border-top:1px solid var(--line);padding-top:12px;margin-top:14px}
footer{border-top:1px solid var(--line);margin-top:24px;padding:22px 0 40px}footer a{color:var(--muted)}
@media(max-width:640px){header .wrap,.choice-wide header .wrap{padding:12px 20px}.mail{padding:16px!important}.mf .b,.cf .b{width:100%}.sr-card{padding:14px 16px}}
`;
// De keuzevensters (ingrepen, landen): zelfde stijl. Eén rond zoekveld, rijen met een lijn, geen soortnaam per rij.
export const LOOK_DIALOG_CSS = `
.tp-dialog,.cp-dialog{border-radius:14px;border:1px solid var(--line);box-shadow:0 14px 38px #17274420;color:var(--body)}
.tp-dialog::backdrop,.cp-dialog::backdrop{background:#11111366;backdrop-filter:none}
.tp-head{padding:22px 22px 14px}
.tp-head h2,.cp-head h2,.s-choice .cp-head h2{font-size:24px!important;line-height:1.3!important;letter-spacing:-.02em!important;margin:0 0 4px!important}
.tp-close,.cp-close{background:var(--acc2)!important;color:var(--ink)!important;border:0!important;border-radius:50%!important;width:40px;min-width:40px;height:40px;font-size:22px!important;padding:0!important;min-height:0}
.tp-find{border:1px solid var(--line2);border-radius:999px;padding:0 18px;margin:0 22px}
.tp-find:focus-within{border-color:var(--acc)}
.tp-find svg{color:var(--muted)}
.tp-dialog .tp-find input[type=search]:not([type=hidden]):not([type=checkbox]):not([type=radio]){border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;padding:0!important;min-height:50px;background:transparent}
.tp-categories{gap:10px;margin-top:14px;padding:0 22px 10px}
.tp-options{padding:0 22px 12px}
.tp-options ul{gap:0 24px}
.tp-options button{border:0!important;border-top:1px solid var(--line)!important;border-radius:0!important;min-height:52px;padding:14px 0;background:none!important}
.tp-options strong{font-weight:600;font-size:17px!important;color:var(--ink)}
.tp-options button[aria-pressed=true] strong{color:var(--acc)}
.tp-options small{display:none}
.tp-mark{background:var(--acc2)!important;color:var(--acc)!important;width:28px;height:28px;font-size:18px;border-radius:50%}
.tp-options button[aria-pressed=true] .tp-mark{background:var(--acc)!important;color:#fff!important}
.tp-foot{padding:14px 22px}
.tp-foot #tp-count{font-size:15px!important;font-weight:600;color:var(--ink)}
.tp-foot #tp-clear{font-size:14px!important;color:var(--muted)!important}
.cp-dialog .cp-options>button{border-radius:999px;font-size:17px;color:var(--ink);padding:11px 16px}
.cp-dialog .cp-options>button[aria-selected=true]{background:var(--acc2);color:var(--acc);border-color:transparent}
@media(max-width:600px){.tp-dialog,.cp-dialog{border-radius:14px 14px 0 0}}
`;
