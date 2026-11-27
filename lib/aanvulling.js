// Aanvulling van keuzehulpen vanuit de repo (dagronde keuzehulpen, 27 nov 2026; skill keuzehulpen-groei sectie 5c stap 2).
// De vraag waarop de chat het vaakst "weet niet" zegt krijgt hier een antwoord in de data van die pagina, zonder de opslag te
// herschrijven. Geldt voor de pagina (FAQ, eerst getoond) en voor de chat (lib/kzchat.js leest dezelfde items).
// Vorm: AANVULLING[site][slug] = { faq: [{ q, a, bron, dag }] }. site: nl (keuzehulp.best), us (whichtobuy.best), de (kaufberater.best).
// Regels: feiten alleen met bron, geen verzonnen prijzen, geen gedachtestreepjes. Een vraag die al op de pagina staat wordt overgeslagen.
export const AANVULLING = {
  nl: {},
  us: {},
  de: {
    'smart-home-matter-starter-set-thread-hub': { faq: [
      { q: 'Welcher Hub passt zu Alexa oder Google Home?', a: 'Bei Alexa nimm einen Echo (4. Generation) als Kern: er hat einen Thread-Border-Router eingebaut und steuert Matter-Geräte direkt. Bei Google Home übernimmt ein Nest Hub (2. Generation), ein Nest Hub Max oder ein Nest Wifi Pro diese Rolle. Dazu zwei bis drei Matter-Steckdosen und ein bis zwei Thread-Sensoren, bei denen „Matter“ und „Thread“ ausdrücklich in der Beschreibung stehen.', bron: 'https://developer.amazon.com/en-US/blogs/alexa/device-makers/2021/11/support-for-matter-over-thread-coming-to-echo-and-eero-devices.html https://support.google.com/googlenest/answer/9249088', dag: '2026-11-27', voor: 1 }
    ] }
  }
};

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, ' ').trim();

export function vulAan(site, items) {
  const A = AANVULLING[site]; if (!A || !Array.isArray(items)) return items;
  return items.map(it => {
    const x = it && it.slug && A[it.slug]; if (!x) return it;
    const oud = Array.isArray(it.faq) ? it.faq : []; const er = new Set(oud.map(f => norm(f && f.q)));
    const nieuw = (x.faq || []).filter(f => f && f.q && f.a && !er.has(norm(f.q)));
    return nieuw.length ? Object.assign({}, it, { faq: nieuw.concat(oud) }) : it;
  });
}
