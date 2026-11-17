// todayin surgery: de strakke laag (Henkjan 17 nov 2026: "Je moet echt terug naar outname.now look design is niet strak meer ...
// pak evt andere kleur bijv een soort klinieken groen"). Deze CSS komt als laatste in elke pagina en zet de huisstijl van outname.now
// terug over alles wat er in de loop van de bouw bij kwam: één smalle kolom, zwarte tekst (geen grijs), drie lettermaten (14, 16, 20
// plus de paginatitel), ronde velden en knoppen, geen blauwe links, lijnen in plaats van gekleurde vlakken, en één accentkleur.
// Accent: kliniekgroen. Nieuwe onderdelen: geen eigen lettermaat, kleur of afronding toevoegen, maar deze laag laten gelden.
export const ACCENT = '#0F7B5F';
export const LOOK_CSS = `
:root{--ink:#111113;--zacht:#111113;--line:#E5E7EB;--line2:#B9BFC7;--acc:${ACCENT};--acc2:#E7F4EF;--bg:#fff;--sr-hover:#F6F8F7}
@media (prefers-color-scheme:dark){:root{--ink:#F2F3F5;--zacht:#F2F3F5;--line:#272C37;--line2:#4A5260;--acc:#6FD3B0;--acc2:#12302A;--bg:#0F1116;--sr-hover:#161B1A}}
body{font-size:16px;line-height:1.6;color:var(--ink);-webkit-font-smoothing:antialiased}
.wrap,.choice-wide .wrap,.choice-wide footer .wrap{max-width:800px;padding-left:20px;padding-right:20px}
header .wrap,.choice-wide header .wrap{max-width:1080px}
main{padding:28px 0 56px}
h1{font-size:clamp(30px,5.4vw,44px)!important;line-height:1.12;letter-spacing:-.03em;margin:6px 0 14px;text-wrap:balance}
h2,.pv h2,.s-choice h2{font-size:20px!important;line-height:1.3;letter-spacing:-.01em;font-weight:700;margin:40px 0 10px}
h3,h4,.sr-card h3{font-size:16px!important;font-weight:700;letter-spacing:0}
p,li,td,th,summary,label,input,select,button,details{font-size:16px}
main a{color:var(--ink)!important;text-decoration:underline;text-decoration-color:var(--line2);text-decoration-thickness:1px;text-underline-offset:3px}
main a:hover{text-decoration-color:var(--acc)}
.mark,.tl a,.sr-tabs a,.sr-breadcrumb a,.cards a,.sr-topics a,.sr-links a,a.b,main a.b,.sr-card h3 a{text-decoration:none!important}
.mark em{color:var(--acc)}
.tl a{color:var(--ink);font-size:14px;font-weight:600;padding:4px 8px;border-radius:999px;margin-left:2px}
.tl a[aria-current]{color:var(--acc);background:var(--acc2)}
.sr-muted,.klein,.meta,.com,.sr-note,.sr-list-note,.sr-breadcrumb,.sr-breadcrumb a,.sr-sources,.sr-sources a,.sr-stats,.cp-scope,.mf-label,.mf label,.mail .mf-consent,.mail .mf-heading p:last-child,.mf-more summary,.sr-index>span,.sr-index strong small,.sr-position,.sr-tabs a,.sr-table thead th,.sr-table caption,.sr-table small,small,footer,footer .wrap,.sr-lead,.sr-context summary,.sr-unranked summary,.sr-staff summary,.sr-card details summary{font-size:14px!important;color:var(--ink)!important;font-weight:400}
.sr-card details summary,.sr-context summary,.sr-unranked summary,.sr-staff summary,.mf-more summary,.sr-table thead th,.sr-tabs a{font-weight:600}
.sr-lead{font-size:16px!important}
.sr-lead:has(+ #samenvatting){display:none}
.sr-list-note{display:none}
input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,.mf input:not([type=hidden]),.mf select,.tp-trigger,.cp-trigger,#sr-search,.cf input{border-radius:999px!important;border:1px solid var(--line2)!important;padding-left:18px!important;padding-right:18px!important;min-height:48px;font-size:16px!important;background-color:var(--bg);color:var(--ink)}
.b,main a.b{border-radius:999px!important;background:var(--acc);color:#fff!important;font-size:16px!important;font-weight:600;min-height:48px;padding:11px 24px;border:0}
@media (prefers-color-scheme:dark){.b,main a.b{color:#0B1F19!important}}
.chips button,.sr-category-tabs button,.mf-stages button{border-radius:999px!important;font-size:14px!important;color:var(--ink);border:1px solid var(--line2)}
.sr-category-tabs button[aria-pressed=true],.mf-stages button[aria-checked=true]{background:var(--acc);border-color:var(--acc);color:#fff}
.sr-tabs{background:none;border:0;padding:0;gap:8px;border-radius:0;width:auto;justify-content:flex-start;margin:28px 0 12px}
.sr-tabs a,.sr-tabs a:first-child{border:1px solid var(--line2);border-radius:999px;background:none;box-shadow:none;padding:8px 16px;min-height:40px}
.sr-tabs a:hover{border-color:var(--acc);background:none;color:var(--ink)}
.answer,.pv .answer{background:var(--acc2);border-radius:14px;padding:18px 22px;margin:20px 0 24px}
#samenvatting{background:none;padding:0;margin:0 0 24px;border-radius:0}
#samenvatting p{margin:0 0 10px}
.mail,.chat,.sr-card,.sr-ranked,.sr-topics,.sr-topicgroups>*,.cards>*,.calc{border-radius:14px}
.mail{background:var(--bg);border:1px solid var(--line);padding:20px 22px;margin:28px 0}
.mail h2,.pv .mail h2,.s-choice .mail h2{margin:0 0 4px!important}
.sr-topics a,.sr-topicgroups a,.sr-links a{font-size:16px}
.mf .b{padding:11px 20px}
.sr-position{background:none;color:var(--ink)!important;font-weight:700;width:auto;min-height:0;justify-content:flex-start}
.sr-index strong{font-size:20px!important;letter-spacing:-.02em}
.sr-table table{font-size:16px}.sr-table th,.sr-table td{border-bottom:1px solid var(--line);padding:10px 12px;font-size:16px}
details{border-color:var(--line)}
footer{border-top:1px solid var(--line)}footer a{color:var(--ink)}
`;
// De keuzevensters (ingrepen, landen): zelfde rust. Eén zoekveld met één rand, rijen met een lijn in plaats van dikke kaarten,
// geen soortnaam onder elke rij (de knoppen erboven zeggen dat al), geen gekleurde rondjes.
export const LOOK_DIALOG_CSS = `
.tp-dialog,.cp-dialog{border-radius:14px;border:1px solid var(--line);box-shadow:0 20px 60px #11111326;font-size:16px}
.tp-dialog::backdrop,.cp-dialog::backdrop{background:#11111366;backdrop-filter:none}
.tp-head h2,.cp-head h2{font-size:20px!important;margin:0 0 4px!important}
.tp-head p{font-size:14px!important}
.tp-close,.cp-close{background:none!important;color:var(--ink)!important;border:1px solid var(--line2)!important;border-radius:50%!important;width:40px;min-width:40px;height:40px;font-size:22px!important;padding:0!important;min-height:0}
.tp-find{border:1px solid var(--line2);border-radius:999px;padding:0 18px}
.tp-find:focus-within{border-color:var(--acc);box-shadow:0 0 0 3px var(--acc2)}
.tp-dialog .tp-find input[type=search]:not([type=hidden]):not([type=checkbox]):not([type=radio]){border:0!important;border-radius:0!important;outline:0!important;box-shadow:none!important;padding:0!important;min-height:46px;background:transparent}
.cp-search input:focus,#sr-search:focus,.mf input:focus{outline:0;border-color:var(--acc)!important;box-shadow:0 0 0 3px var(--acc2)}
.tp-categories{gap:8px;margin-top:14px}
.tp-categories button{font-size:14px!important;color:var(--ink);border:1px solid var(--line2);padding:7px 14px;min-height:38px}
.tp-categories button[aria-pressed=true]{background:var(--acc);border-color:var(--acc);color:#fff}
.tp-options ul{gap:0 24px}
.tp-options button{border:0!important;border-bottom:1px solid var(--line)!important;border-radius:0!important;min-height:52px;padding:12px 2px;background:none!important}
.tp-options strong{font-weight:400;font-size:16px!important}
.tp-options button[aria-pressed=true] strong{font-weight:700}
.tp-options small{display:none}
.tp-mark{background:none!important;color:var(--ink)!important;width:auto;height:auto;font-size:20px;border-radius:0}
.tp-options button[aria-pressed=true] .tp-mark{color:var(--acc)!important}
.tp-foot #tp-count,.tp-foot #tp-clear,.cp-foot,.cp-group{font-size:14px!important;color:var(--ink)!important}
.tp-foot #tp-clear{text-decoration-color:var(--line2);text-underline-offset:3px}
.tp-foot .b{font-size:16px!important}
.b[disabled],.b[aria-disabled=true]{opacity:.45}
@media (prefers-color-scheme:dark){.tp-categories button[aria-pressed=true]{color:#0B1F19}}
`;
