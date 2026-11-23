// Zichtbare merknamen en korte, feitelijke context. Alleen activeren na de UX-proef.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const T = {
  nl: { more: 'Ook interessant', contact: 'Contact', privacy: 'Privacy en voorwaarden', gifts: 'Cadeaus, wonen en lifestyle.', nexy: 'AI-assistent voor gesprekken, taken en afspraken.', shared: 'Vind mensen voor wat je zoekt of biedt, via je AI.', guides: 'Engelstalige keuzehulpen voor producten en diensten.' },
  en: { more: 'Also interesting', contact: 'Contact', privacy: 'Privacy and terms', gifts: 'Gifts, home and lifestyle.', nexy: 'An AI assistant for conversations, tasks and plans.', shared: 'Find people for what you need or offer, through your AI.', guides: 'Buying guides for products and services, in English.' },
  de: { more: 'Auch interessant', contact: 'Kontakt', privacy: 'Datenschutz und Bedingungen', gifts: 'Geschenke, Wohnen und Lifestyle.', nexy: 'KI-Assistent für Gespräche, Aufgaben und Termine.', shared: 'Finde Menschen für das, was du suchst oder anbietest, über deine KI.', guides: 'Englischsprachige Kaufberatung für Produkte und Dienstleistungen.' },
  es: { more: 'También te puede interesar', contact: 'Contacto', privacy: 'Privacidad y condiciones', gifts: 'Regalos, hogar y estilo de vida.', nexy: 'Un asistente de IA para conversaciones, tareas y citas.', shared: 'Encuentra personas para lo que buscas u ofreces, a través de tu IA.', guides: 'Guías en inglés para elegir productos y servicios.' },
  pt: { more: 'Também pode interessar', contact: 'Contato', privacy: 'Privacidade e termos', gifts: 'Presentes, casa e estilo de vida.', nexy: 'Assistente de IA para conversas, tarefas e compromissos.', shared: 'Encontre pessoas para o que procura ou oferece, através da sua IA.', guides: 'Guias em inglês para escolher produtos e serviços.' },
};
export const FOOTER_CSS = `
footer.cd-footer{--cd-foot-size:14px;border-top:1px solid var(--line,#ddd);background:var(--bg,#fff);color:var(--ink,#111113);padding:0;margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-align:left}
footer.cd-footer .cd-footer-in{max-width:1040px;margin:0 auto;padding:20px 26px}
html body footer.cd-footer a,html body footer.cd-footer p,html body footer.cd-footer h2,html body footer.cd-footer li,html body footer.cd-footer span{color:inherit!important;opacity:1!important;font-size:var(--cd-foot-size)!important;font-weight:400!important;letter-spacing:0!important;text-transform:none!important}
footer.cd-footer a{line-height:1.5;text-decoration:underline;text-underline-offset:3px}
html body footer.cd-footer a:link,html body footer.cd-footer a:visited,html body footer.cd-footer a:hover,html body footer.cd-footer a:focus,html body footer.cd-footer a:active{color:inherit!important;text-decoration-color:currentColor!important;text-decoration-thickness:1px!important}
footer.cd-footer a:focus-visible{outline:2px solid currentColor;outline-offset:4px;border-radius:2px}
footer.cd-footer .cd-footer-top{display:flex;align-items:baseline;justify-content:space-between;gap:4px 24px;flex-wrap:wrap}
footer.cd-footer .cd-powered{margin:0;line-height:1.5;white-space:nowrap}
footer.cd-footer .cd-powered a{text-decoration:none}
footer.cd-footer .cd-legal{display:flex;gap:0 20px;flex-wrap:wrap}
footer.cd-footer .cd-legal a{display:inline-flex;align-items:center;min-height:32px}
footer.cd-footer .cd-more{margin:14px 0 6px;line-height:1.5}
footer.cd-footer .cd-brands{list-style:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 24px;margin:0;padding:0}
footer.cd-footer .cd-brands li{margin:0;padding:0;min-width:0;list-style:none;line-height:1.6}
footer.cd-footer .cd-brands a{display:inline-block;padding:2px 0;min-height:24px}
footer.cd-footer .cd-independent{max-width:90ch;line-height:1.6;margin:16px 0 0;padding:0;border:0}
@media(max-width:600px){footer.cd-footer .cd-footer-in{padding:18px 20px}footer.cd-footer .cd-footer-top{gap:2px}footer.cd-footer .cd-legal{gap:0 18px}footer.cd-footer .cd-brands{grid-template-columns:1fr;gap:4px}footer.cd-footer .cd-independent{margin-top:14px}}
`;
export function renderCurFooter(m = 'nl', opt = {}) {
  m = T[m] ? m : 'en'; const t = T[m];
  const brands = [['Kadoly', 'https://kadoly.com/', t.gifts], ['Nexy', 'https://nexy.works/', t.nexy], ['sharedby.ai', 'https://sharedby.ai/', t.shared], ['Which To Buy', 'https://whichtobuy.best/', t.guides, 'en']];
  return '<style>' + FOOTER_CSS + '</style><footer class="cd-footer" data-footer-versie="merken-3-rustig"><div class="cd-footer-in">'
    + '<div class="cd-footer-top"><p class="cd-powered">Powered by <a href="https://todayin.email/">todayin</a></p>'
    + '<nav class="cd-legal" aria-label="' + esc(opt.privacy || t.privacy) + '"><a href="https://curacao.day/' + m + '#contact" data-contact="1">' + esc(opt.contact || t.contact) + '</a><a href="https://curacao.day/' + m + '/privacy">' + esc(opt.privacy || t.privacy) + '</a></nav></div>'
    + '<nav aria-labelledby="cd-footer-more"><h2 class="cd-more" id="cd-footer-more">' + esc(t.more) + '</h2><ul class="cd-brands">'
    + brands.map(([name, url, description, lang]) => '<li><a href="' + esc(url) + '"' + (lang ? ' lang="' + lang + '" hreflang="' + lang + '"' : '') + '>' + esc(name) + '</a><span> · ' + esc(description) + '</span></li>').join('') + '</ul></nav>'
    + (opt.disclaimer ? '<p class="cd-independent">' + esc(opt.disclaimer) + '</p>' : '') + '</div></footer>';
}
export function footerVoorbeeld(m = 'nl', opt = {}) {
  m = T[m] ? m : 'en';
  return '<!doctype html><html lang="' + m + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>A Curaçao day · footer</title><style>body{margin:0;background:#fff;color:#111113;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:16px}main{max-width:1040px;margin:auto;padding:26px 26px 38px}main p{font-size:16px;margin:0}main a{color:inherit;text-decoration:none;font-weight:700}@media(max-width:480px){main{padding:22px 20px 30px}}@media(prefers-color-scheme:dark){body{--bg:#111113;--ink:#fff;--line:#555;background:var(--bg);color:var(--ink)}}</style></head><body><main><p><a href="https://curacao.day/' + m + '">A Curaçao day</a></p></main>' + renderCurFooter(m, opt) + '</body></html>';
}
