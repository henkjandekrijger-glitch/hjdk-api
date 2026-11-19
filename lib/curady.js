// Curady (curady.com), high-ticket tak van Kadoly op dezelfde motor (Henkjan 18 nov 2026: "aparte tak op kadoly met aparte domeinnaam . Maar zelfde motor", naam "Yes leg vast").
// Nu een wachtpagina met noindex: pas in Google als de producten (Baltresto, Rest Lords) in de winkel staan, zodat er geen dunne pagina in de index komt.
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const WA = 'https://wa.me/31655395630?text=' + encodeURIComponent('Hi Curady, I have a question about');

const SOORTEN = [
  ['Barrel saunas', 'Solid wood outdoor saunas for two to eight people, with a wood or electric heater.'],
  ['Wood-fired hot tubs', 'Hot tubs that heat on wood, with the stove inside or outside the tub.'],
  ['Massage chairs', 'Full-body chairs with an L or SL rail, chosen on fit and space in the room.'],
];

function home() {
  const kaart = SOORTEN.map(([t, x]) => `<div class="k"><h2>${esc(t)}</h2><p>${esc(x)}</p></div>`).join('');
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Curady | Wellness at home, chosen with care</title>
<meta name="description" content="Curady helps you choose and buy a barrel sauna, wood-fired hot tub or massage chair, delivered to your home in Europe.">
<meta name="robots" content="noindex,follow">
<style>
:root{--bg:#fbfaf7;--ink:#1d1b18;--sub:#5d5850;--line:#e4e0d8;--acc:#2f5d50}
@media (prefers-color-scheme:dark){:root{--bg:#161514;--ink:#f1eee8;--sub:#b5afa5;--line:#34312d;--acc:#8fc4b4}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 Inter,system-ui,sans-serif}
main{max-width:760px;margin:0 auto;padding:56px 20px 40px}
.m{font-weight:700;font-size:18px;letter-spacing:.04em;color:var(--acc)}
h1{font-size:34px;line-height:1.15;margin:18px 0 12px}h2{font-size:18px;margin:0 0 6px}
p{margin:0 0 14px;color:var(--sub)}
.g{display:grid;gap:12px;margin:28px 0}.k{border:1px solid var(--line);border-radius:14px;padding:16px 18px}.k p{margin:0}
a.b{display:inline-block;background:var(--acc);color:#fff;text-decoration:none;font-weight:700;border-radius:12px;padding:12px 18px;margin-top:6px}
@media (prefers-color-scheme:dark){a.b{color:#10201b}}
footer{max-width:760px;margin:0 auto;padding:0 20px 40px;font-size:13px;color:var(--sub)}
</style></head><body><main>
<div class="m">CURADY</div>
<h1>Wellness at home, chosen with care</h1>
<p>We help you pick the right sauna, hot tub or massage chair for your home and garden, and we arrange delivery across Europe. Honest advice first, then the order.</p>
<div class="g">${kaart}</div>
<p>The shop opens soon. Questions now? Send us a message.</p>
<a class="b" href="${WA}">WhatsApp +31 6 55395630</a>
</main><footer>Curady is part of Kadoly, run by AdsFair B.V., Gouda, the Netherlands.</footer></body></html>`;
}

export async function cyOp(op, { res }) {
  if (op === 'cyrobots') { res.setHeader('content-type', 'text/plain; charset=utf-8'); return res.status(200).send('User-agent: *\nAllow: /\n'); }
  res.setHeader('content-type', 'text/html; charset=utf-8'); res.setHeader('x-robots-tag', 'noindex, follow'); res.setHeader('cache-control', 'public, max-age=300');
  return res.status(200).send(home());
}
