// Startpagina van hjdk-api.vercel.app: laat zien wat dit domein is (keuzehulpen van Yoors), met links naar de pagina's.
// Belangrijk voor de beoordeling van het bol-partnerkanaal: een bezoeker (of bol) die de hoofdpagina opent, moet een echte site zien.
const KEUZEHULPEN = [
  ['afvalemmer-kiezen-voor-kleine-keuken', 'Een afvalemmer kiezen voor een kleine keuken'],
  ['microvezeldoek-kiezen-en-gebruiken', 'Een microvezeldoek kiezen en gebruiken'],
  ['afwasteil-kiezen-voor-kleine-gootsteen', 'Een afwasteil kiezen voor een kleine gootsteen'],
  ['voorraadbus-kiezen-om-te-stapelen', 'Voorraadbussen die je kunt stapelen'],
  ['vloerwisser-kiezen-voor-kleine-woning', 'Een vloerwisser voor een kleine woning'],
  ['gootsteenorganiser-kiezen-voor-klein-aanrecht', 'Een gootsteenorganiser voor een klein aanrecht'],
  ['strijkplank-kiezen-voor-kleine-ruimte', 'Een strijkplank voor een kleine ruimte'],
  ['kruidenrek-kiezen-voor-smalle-kast', 'Een kruidenrek voor een smalle kast'],
  ['droogmolen-kiezen-voor-kleine-tuin', 'Een droogmolen voor een kleine tuin'],
  ['pedaalemmer-kiezen-voor-kleine-badkamer', 'Een pedaalemmer voor een kleine badkamer'],
  ['douchewisser-kiezen-voor-kleine-douche', 'Een douchewisser voor een kleine douche'],
  ['wasmand-kiezen-voor-kleine-ruimte', 'Een wasmand voor een kleine ruimte'],
  ['keukenkastjes-indelen-met-opbergbakken', 'Keukenkastjes indelen met opbergbakken']
];
const THEMAS = [['keuken-klein', 'Slim kiezen voor een kleine keuken'], ['huishouden', 'Huishouden slim aanpakken']];
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

import kz from './kz.js';
export default async function handler(req, res) {
  try { const host = String(req.headers.host || ''); if (host && !/vercel\.app$|^localhost/.test(host)) return kz(req, res); } catch (e) {} /* eigen domein (keuzehulp): startpagina = keuzehulp-overzicht */
  res.setHeader('cache-control', 'public, max-age=300');
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Yoors Keuzehulp — korte productgidsen voor een klein huis</title>
<meta name="description" content="Korte, eerlijke keuzehulpen van Yoors (yoo.rs) voor huishouden en een kleine keuken, met actuele prijzen van bol.">
<style>body{margin:0;font:16px/1.55 -apple-system,system-ui,Segoe UI,Roboto,sans-serif;background:#f6f7f9;color:#111}main{max-width:640px;margin:0 auto;padding:28px 16px 48px}h1{font-size:26px;line-height:1.2;margin:0 0 8px}h2{font-size:18px;margin:28px 0 10px}p{color:#374151;margin:0 0 14px}.c{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px 20px}ul{list-style:none;padding:0;margin:0}li{margin:0}li a{display:block;padding:11px 0;border-top:1px solid #f1f5f9;color:#0000ff;text-decoration:none;font-weight:600}li:first-child a{border-top:0}.t a{background:#0000ff;color:#fff;border-radius:12px;padding:14px 16px;margin-bottom:10px;border:0}small{display:block;margin-top:26px;color:#6b7280;font-size:13px}a.y{color:#0000ff}</style></head>
<body><main>
<h1>Yoors Keuzehulp</h1>
<p>Korte, eerlijke productgidsen van <a class="y" href="https://yoo.rs">Yoors</a> — vooral voor mensen met weinig ruimte: een kleine keuken, een kleine badkamer, een klein huis. Per gids één of een paar producten die echt passen, met de actuele prijs bij bol erbij.</p>
<div class="c"><h2 style="margin-top:0">Themapagina's</h2><ul class="t">${THEMAS.map(([p, t]) => `<li><a href="/t/${esc(p)}">${esc(t)} →</a></li>`).join('')}</ul></div>
<div class="c" style="margin-top:14px"><h2 style="margin-top:0">Keuzehulpen</h2><ul>${KEUZEHULPEN.map(([s, t]) => `<li><a href="/b/${esc(s)}">${esc(t)}</a></li>`).join('')}</ul></div>
<h2>Hoe wij werken</h2>
<p>Elke keuzehulp is geschreven door Yoors en linkt naar een specifiek product bij bol. Prijzen en beoordelingen komen rechtstreeks van bol en worden regelmatig ververst; we tonen geen prijshistorie en sturen niemand automatisch door — je klikt zelf.</p>
<p>Affiliate-vermelding: Yoors ontvangt een vergoeding van bol als je via onze link iets koopt. De prijs die je betaalt verandert daardoor niet.</p>
<small>Yoors Keuzehulp is onderdeel van yoo.rs. Vragen: via <a class="y" href="https://yoo.rs">yoo.rs</a>.</small>
</main></body></html>`;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
}
