// Het gezicht van Clickmind (20 nov 2026, Henkjan: "Clickmind heeft voor mij nu geen gezicht maak dat er meteen bij").
// Eén pagina: wat de advertenties kostten, wie er echt kwam, wat er verkocht werd en wat dat opleverde, per netwerk en per advertentie,
// met een advies per regel. Zwart op wit, geen grijs (Henkjan 19 nov: "altijd max contrast dus geen grijs"). Alleen tekst en tabellen, geen scripts.

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const eur = v => (v < 0 ? '−' : '') + '€' + Math.abs(Number(v) || 0).toFixed(2).replace('.', ',');
const nl = n => Number(n || 0).toLocaleString('nl-NL');
const pct = (a, b) => b > 0 ? (Math.round(1000 * a / b) / 10).toString().replace('.', ',') + '%' : '';

// Advies per advertentie of netwerk: stoppen als er twee keer de toegestane kosten per verkoop uitging zonder verkoop,
// opschalen als de winst na advertentiekosten positief is met minstens 2 verkopen, anders doorleren.
export function advies(r) {
  const kosten = Number(r.kosten) || 0, verkopen = Number(r.verkopen) || 0, winst = (Number(r.marge) || 0) - kosten;
  // 20 nov (Henkjan: "Veel sneller stoppen als geen verkoop"): zonder verkoop stop na €4, of na €1,50 als nog niemand de afrekenpagina haalde
  if (!kosten && !verkopen) return { woord: 'geen data', uitleg: '' };
  if (verkopen === 0 && kosten >= 4) return { woord: 'stop', uitleg: eur(kosten) + ' zonder verkoop' };
  if (verkopen === 0 && kosten >= 1.5 && r.kassa === 0) return { woord: 'stop', uitleg: eur(kosten) + ', niemand op de afrekenpagina' };
  if (verkopen >= 2 && winst > 0) return { woord: 'opschalen', uitleg: eur(winst) + ' winst na advertenties' };
  if (verkopen >= 1 && winst <= 0) return { woord: 'bijsturen', uitleg: 'verkoopt, maar ' + eur(-winst) + ' verlies' };
  return { woord: 'leren', uitleg: 'nog te weinig data' };
}

function tabel(kop, rijen, getal) { // getal = kolommen met bedragen of aantallen (rechts uitgelijnd)
  const g = i => getal && getal.includes(i) ? ' class="g"' : '';
  return '<table><thead><tr>' + kop.map((k, i) => '<th' + g(i) + '>' + esc(k) + '</th>').join('') + '</tr></thead><tbody>' + rijen.map(r => '<tr>' + r.map((c, i) => '<td' + g(i) + '>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
}

export function render(d) {
  const t = d.totaal || {};
  const winst = (t.marge || 0) - (t.kosten || 0);
  const tegel = (getal, label) => '<div class="tg"><b>' + getal + '</b><span>' + esc(label) + '</span></div>';
  const netRijen = (d.netten || []).map(n => { const a = advies(n); return [esc(n.naam), n.kosten ? eur(n.kosten) : '', nl(n.aangekomen), nl(n.mens) + (n.aangekomen ? ' (' + pct(n.mens, n.aangekomen) + ')' : ''), nl(n.afreken), nl(n.verkopen), n.omzet ? eur(n.omzet) : '', n.verkopen ? eur(n.marge - n.kosten) : (n.kosten ? eur(-n.kosten) : ''), '<span class="w w-' + a.woord.replace(' ', '') + '">' + esc(a.woord) + '</span>']; });
  const adRijen = (d.ads || []).slice(0, 40).map(a => { const ad = advies(a); return [esc(a.naam || a.id), esc(a.netNaam), a.kosten ? eur(a.kosten) : '', nl(a.kliks || 0), a.echt == null ? '' : nl(a.echt), a.kassa == null ? '' : nl(a.kassa), nl(a.verkopen), a.omzet ? eur(a.omzet) : '', eur(a.marge - a.kosten), '<span class="w w-' + ad.woord.replace(' ', '') + '">' + esc(ad.woord) + '</span>' + (ad.uitleg ? '<br>' + esc(ad.uitleg) : '')]; });
  const ordRijen = (d.orders || []).slice(0, 25).map(o => [esc(o.dag), esc(o.product), eur(o.bedrag), esc(o.bron), esc(o.advertentie || ''), esc(o.status)]);
  const kop = (d.koppelingen || []).map(k => '<li><b>' + esc(k.naam) + '</b> ' + (k.aan ? 'aan' : 'uit') + (k.uitleg ? ': ' + esc(k.uitleg) : '') + '</li>').join('');
  const m = d.match || {};
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Clickmind</title>
<style>
:root{--ink:#111113;--bg:#fff;--lijn:#111113}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
main{max-width:1040px;margin:0 auto;padding:28px 20px 60px}
.top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:2px solid var(--lijn);padding-bottom:12px}
.merk{font-weight:700;font-size:24px;letter-spacing:-.02em}.merk i{font-style:normal;display:inline-block;width:12px;height:12px;background:var(--ink);border-radius:50%;margin-right:8px}
nav a{color:var(--ink);font-weight:700;margin-right:14px;text-decoration:underline}
h1{font-size:32px;line-height:1.15;margin:24px 0 6px}h2{font-size:18px;margin:34px 0 10px}
p{margin:6px 0}.klein{font-size:13px}
.tg-r{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:18px 0}
.tg{border:2px solid var(--lijn);border-radius:10px;padding:12px}.tg b{display:block;font-size:24px}.tg span{font-size:13px;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--lijn);vertical-align:top}th{font-size:13px}
td.g,th.g{text-align:right;white-space:nowrap}
.w{display:inline-block;font-weight:700;border:2px solid var(--ink);border-radius:999px;padding:0 8px;font-size:13px}
.w-stop{background:var(--ink);color:var(--bg)}.w-opschalen{background:var(--ink);color:var(--bg)}
.scroll{overflow-x:auto}ul{padding-left:18px}li{margin:4px 0}
@media (prefers-color-scheme:dark){:root{--ink:#fff;--bg:#111113;--lijn:#fff}}
</style></head><body><main>
<div class="top"><div class="merk"><i></i>Clickmind</div><nav><a href="?dagen=1">Vandaag</a><a href="?dagen=7">7 dagen</a><a href="?dagen=28">28 dagen</a></nav></div>
<h1>${esc(d.kop || 'Kadoly')}: ${winst >= 0 ? eur(winst) + ' winst' : eur(-winst) + ' verlies'} na advertenties</h1>
<p>${esc(d.periode || '')}. Winst = marge op betaalde verkopen min advertentiekosten. Alleen echte mensen tellen mee, bots niet.</p>
<div class="tg-r">${tegel(t.kosten ? eur(t.kosten) : '€0', 'advertentiekosten')}${tegel(nl(t.mens), 'echte mensen')}${tegel(nl(t.verkopen), 'betaalde verkopen')}${tegel(t.omzet ? eur(t.omzet) : '€0', 'omzet')}${tegel(t.verkopen && t.kosten ? eur(t.kosten / t.verkopen) : (t.kosten ? 'geen verkoop' : ''), 'kosten per verkoop')}${tegel(eur(winst), 'winst na advertenties')}</div>
${d.adviesTekst ? '<p><b>Advies:</b> ' + esc(d.adviesTekst) + '</p>' : ''}
<h2>Per netwerk</h2><div class="scroll">${tabel(['Netwerk', 'Kosten', 'Aangekomen', 'Echte mensen', 'Afrekenpagina', 'Verkopen', 'Omzet', 'Winst', 'Advies'], netRijen, [1, 2, 3, 4, 5, 6, 7])}</div>
<h2>Per advertentie</h2>${adRijen.length ? '<div class="scroll">' + tabel(['Advertentie', 'Netwerk', 'Kosten', 'Kliks', 'Echte mensen*', 'Afrekenpagina*', 'Verkopen', 'Omzet', 'Winst', 'Advies'], adRijen, [2, 3, 4, 5, 6, 7, 8]) + '<p class="klein">* sinds de start van de advertentie.</p>' + '</div>' : '<p>Nog geen advertentiekosten binnen voor deze periode.</p>'}
<h2>Laatste bestellingen</h2>${ordRijen.length ? '<div class="scroll">' + tabel(['Dag', 'Product', 'Bedrag', 'Bron', 'Advertentie', 'Status'], ordRijen, [2]) + '</div>' : '<p>Geen bestellingen in deze periode.</p>'}
<h2>Wat Clickmind beter doet dan een tracker</h2>
<ul>
<li><b>${nl(m.metKlik || 0)} van ${nl(m.betaald || 0)}</b> betaalde bestellingen hangen aan een advertentieklik${m.teruggevonden ? ', waarvan ' + nl(m.teruggevonden) + ' teruggevonden via e-mail' : ''}${m.alleenVingerafdruk ? '; ' + nl(m.alleenVingerafdruk) + ' zonder klik toch aan TikTok gemeld met vingerafdruk' : ''}.</li>
<li>Netwerken krijgen pas een conversie bij een bewuste stap, nooit bij een snelle tik of een bot, en altijd van server naar server.</li>
<li>Winst per advertentie met de marge per product, niet alleen omzet.</li>
</ul>
<h2>Koppelingen</h2><ul>${kop}</ul>
<p class="klein">Bijgewerkt ${esc(d.nu || '')}. Kosten komen van de netwerken (TikTok elk uur), verkopen uit de shop, marge uit de inkoopprijzen.</p>
</main></body></html>`;
}
