#!/usr/bin/env node
// Maakt api/[hjdkfn].js: één Vercel-functie voor alle handlers in fn/.
// Henkjan 21 nov 2026: "Dicht alle lekken" en "Zorg dat ook nooit meer een nieuwe kan ontstaan". Vercel bouwt elk bestand in api/
// als losse functie; met 39 bestanden duurde een build ±65 s, 107 keer per dag. Nu staat de code van de eindpunten in fn/.
// In api/ blijven alleen: [hjdkfn].js (deze router), mm.js (Clickmind, bewust een eigen functie) en de map hjdk/.
//
//   node scripts/router-maak.mjs          schrijft de router opnieuw (na een nieuw bestand in fn/)
//   node scripts/router-maak.mjs --check  faalt als de router niet bij fn/ past of er een los bestand in api/ staat
import fs from 'node:fs';

const hier = new URL('.', import.meta.url);
const fnDir = new URL('../fn/', hier), apiDir = new URL('../api/', hier), doel = new URL('../api/[hjdkfn].js', hier);
export const LOS = ['[hjdkfn].js', 'mm.js', 'hjdk'];
const namen = fs.readdirSync(fnDir).filter(f => /^[a-z0-9-]+\.js$/.test(f)).map(f => f.slice(0, -3)).sort();

const inhoud = `// GEGENEREERD door scripts/router-maak.mjs. Niet met de hand wijzigen: draai dat script.
// Eén Vercel-functie voor alle handlers in fn/ (Henkjan 21 nov 2026: "Dicht alle lekken"). /api/<naam> en elke rewrite naar
// /api/<naam>?... komt hier binnen (dynamische route, parameter hjdkfn) en gaat naar fn/<naam>.js met dezelfde req en res.
// Nieuw eindpunt: liever een actie (op=...) in een bestaand bestand; anders een bestand in fn/ en dan node scripts/router-maak.mjs.
// Nooit een nieuw bestand in api/: elk bestand daar is een eigen functie en maakt elke build langer (.vercelignore laat het weg).
const FN = {
${namen.map(n => `  ${/^[a-z_$][a-z0-9_$]*$/i.test(n) ? n : JSON.stringify(n)}: () => import('../fn/${n}.js'),`).join('\n')}
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
  const p = /\\/api\\/([^/?#]+)/.exec(q < 0 ? url : url.slice(0, q));
  return p ? p[1] : '';
}

export default async function handler(req, res) {
  const url = req.url || '', naam = wie(url).replace(/\\.js$/, '');
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
`;

const losInApi = fs.readdirSync(apiDir).filter(f => !LOS.includes(f));
if (process.argv.includes('--check')) {
  const fouten = [];
  if (!fs.existsSync(doel) || fs.readFileSync(doel, 'utf8') !== inhoud) fouten.push('api/[hjdkfn].js past niet bij fn/: draai node scripts/router-maak.mjs');
  if (losInApi.length) fouten.push('los bestand in api/ (hoort in fn/): ' + losInApi.join(', '));
  if (fouten.length) { console.error(fouten.join('\n')); process.exit(1); }
  console.log(`router klopt: ${namen.length} handlers achter één functie`);
} else if (!process.argv.includes('--stil')) {
  fs.writeFileSync(doel, inhoud);
  console.log(`api/[hjdkfn].js geschreven: ${namen.length} handlers` + (losInApi.length ? `\nLET OP, los bestand in api/ (hoort in fn/): ${losInApi.join(', ')}` : ''));
}
