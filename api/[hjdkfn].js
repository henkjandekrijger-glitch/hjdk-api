// GEGENEREERD door scripts/router-maak.mjs. Niet met de hand wijzigen: draai dat script.
// Eén Vercel-functie voor alle handlers in fn/ (Henkjan 21 nov 2026: "Dicht alle lekken"). /api/<naam> en elke rewrite naar
// /api/<naam>?... komt hier binnen (dynamische route, parameter hjdkfn) en gaat naar fn/<naam>.js met dezelfde req en res.
// Nieuw eindpunt: liever een actie (op=...) in een bestaand bestand; anders een bestand in fn/ en dan node scripts/router-maak.mjs.
// Nooit een nieuw bestand in api/: elk bestand daar is een eigen functie en maakt elke build langer (.vercelignore laat het weg).
const FN = {
  advbeeld: () => import('../fn/advbeeld.js'),
  amz: () => import('../fn/amz.js'),
  b: () => import('../fn/b.js'),
  bol: () => import('../fn/bol.js'),
  bs: () => import('../fn/bs.js'),
  distributie: () => import('../fn/distributie.js'),
  dp: () => import('../fn/dp.js'),
  gads: () => import('../fn/gads.js'),
  geld: () => import('../fn/geld.js'),
  gids: () => import('../fn/gids.js'),
  gsc: () => import('../fn/gsc.js'),
  home: () => import('../fn/home.js'),
  "keuze-leerlus": () => import('../fn/keuze-leerlus.js'),
  "keuze-tools": () => import('../fn/keuze-tools.js'),
  "keuze-updates": () => import('../fn/keuze-updates.js'),
  kz: () => import('../fn/kz.js'),
  kzmaak: () => import('../fn/kzmaak.js'),
  kzmcp: () => import('../fn/kzmcp.js'),
  lc: () => import('../fn/lc.js'),
  md: () => import('../fn/md.js'),
  mm: () => import('../fn/mm.js'),
  nl: () => import('../fn/nl.js'),
  pin: () => import('../fn/pin.js'),
  "pin-connect": () => import('../fn/pin-connect.js'),
  pinterest: () => import('../fn/pinterest.js'),
  post: () => import('../fn/post.js'),
  score: () => import('../fn/score.js'),
  sealed: () => import('../fn/sealed.js'),
  setup: () => import('../fn/setup.js'),
  shop: () => import('../fn/shop.js'),
  t: () => import('../fn/t.js'),
  verzekeringen: () => import('../fn/verzekeringen.js'),
  vindbaarheid: () => import('../fn/vindbaarheid.js'),
  w: () => import('../fn/w.js'),
  wam: () => import('../fn/wam.js'),
  wtb: () => import('../fn/wtb.js'),
  wtbmaak: () => import('../fn/wtbmaak.js'),
  zicht: () => import('../fn/zicht.js'),
  zonescore: () => import('../fn/zonescore.js'),
};
const NAAM = /^[a-z0-9-]+$/;

// Haalt de parameter hjdkfn uit de URL zonder de rest van de query te veranderen.
function zonder(url) {
  const h = url.indexOf('#'), hash = h < 0 ? '' : url.slice(h), u = h < 0 ? url : url.slice(0, h), q = u.indexOf('?');
  if (q < 0) return url;
  const rest = u.slice(q + 1).split('&').filter(p => p !== 'hjdkfn' && !p.startsWith('hjdkfn=')).join('&');
  return u.slice(0, q) + (rest ? '?' + rest : '') + hash;
}
function wie(url) {
  const q = url.indexOf('?'), m = q < 0 ? null : /(?:^|&)hjdkfn=([^&#]*)/.exec(url.slice(q + 1));
  if (m) { try { return decodeURIComponent(m[1]); } catch (e) { return ''; } }
  const p = /\/api\/([^/?#]+)/.exec(q < 0 ? url : url.slice(0, q));
  return p ? p[1] : '';
}

export default async function handler(req, res) {
  const url = req.url || '', naam = wie(url).replace(/\.js$/, '');
  if (naam === 'routergezond') { res.setHeader('cache-control', 'no-store'); return res.status(200).json({ ok: true, handlers: Object.keys(FN).length, methode: req.method, url }); }
  const geen = () => { res.setHeader('x-hjdk-router', 'onbekend eindpunt: code van eindpunten staat in fn/, zie CLAUDE.md Kosten'); return res.status(404).send('Not found'); };
  if (!NAAM.test(naam)) return geen();
  let mod;
  if (FN[naam]) mod = await FN[naam]();
  else {
    // Niet in de lijst (router-maak.mjs niet gedraaid): het bestand zit via includeFiles wel in de functie. Laden en melden.
    try { mod = await import('../fn/' + naam + '.js'); console.warn('hjdk-router: fn/' + naam + '.js staat niet in de router, draai scripts/router-maak.mjs'); }
    catch (e) { return geen(); }
  }
  if (!mod || typeof mod.default !== 'function') return geen();
  // De handler ziet de URL en de query precies zoals voorheen, zonder hjdkfn.
  req.url = zonder(url);
  try { if (req.query && 'hjdkfn' in req.query) delete req.query.hjdkfn; } catch (e) {}
  return mod.default(req, res);
}
