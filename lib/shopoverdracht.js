// Levende overdracht van de Yoors Shop-campagnes (Henkjan 17 okt: "handover op Vercel die altijd geüpdatet wordt door iedere chat
// die daar kijkt"). Twee delen: (1) een stand die bij elk bezoek live wordt opgebouwd uit de tellers, en (2) OVERDRACHT-YOORS-SHOP.md
// uit de repo, die elke chat bijwerkt (pull, aanpassen, push). Lezen: https://hjdk-api-henq.vercel.app/api/shop/overdracht[?vorm=tekst]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function overdrachtTekst() {
  for (const p of [join(process.cwd(), 'OVERDRACHT-YOORS-SHOP.md'), new URL('../OVERDRACHT-YOORS-SHOP.md', import.meta.url).pathname]) { try { return readFileSync(p, 'utf8'); } catch (e) {} }
  return '# Overdracht Yoors Shop-campagnes\n\n(Het bestand OVERDRACHT-YOORS-SHOP.md is niet gevonden in deze uitrol.)\n';
}

const N = v => Number(v) || 0;
const nl = t => { try { return new Date(t).toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return String(t); } };

// live: { nu, uren, sinds, feed, laatst, direct, meet, pa, md, catalogus, marge, geheugen }
export function liveRegels(l) {
  const r = []; const t = (l.uren && l.uren.totaal) || {}; const s = l.sinds || {}; const nets = Object.values(s);
  const carts = nets.reduce((a, x) => a + N(x && x.cart), 0), koop = nets.reduce((a, x) => a + N(x && x.koop), 0);
  r.push('## Stand nu (live, ' + nl(l.nu) + ' Nederlandse tijd)', '');
  r.push('- **Laatste 24 uur:** ' + N(t.paKliks) + ' betaalde PropellerAds-kliks ($' + N(t.paKosten).toFixed(2) + '), ' + N(t.aangekomen) + ' aangekomen, ' + N(t.echt) + ' echt mens' + (N(t.aangekomen) ? ' (' + Math.round(100 * N(t.echt) / N(t.aangekomen)) + '%)' : '') + ', ' + N(t.cart) + ' winkelwagen, ' + N(t.afreken) + ' afrekenpagina, ' + N(t.betaal) + ' betaling gestart, ' + N(t.fout) + ' mislukt, ' + N(t.koop) + ' betaald, €' + N(t.omzet).toFixed(2).replace('.', ',') + ' omzet.');
  r.push('- **Sinds de start:** ' + carts + ' winkelwagens, ' + koop + ' betaald.');
  const L = l.laatst || {}; const w = (k, naam) => naam + ' ' + (L[k] ? nl(L[k].at) + (L[k].test ? ' (test)' : '') : 'nooit');
  r.push('- **Laatste melding van de shop:** ' + [w('cart', 'winkelwagen'), w('afreken', 'afrekenen'), w('betaal', 'betaling gestart'), w('fout', 'mislukt'), w('koop', 'betaald'), w('koop:ideal', 'betaald iDEAL'), w('koop:paypal', 'betaald PayPal')].join(' · ') + '.');
  const f = l.feed; r.push('- **Datapagina van de shop:** ' + (!f ? 'nog niet opgehaald' : f.status === 200 ? 'werkt (' + nl(f.at) + '): ' + N(f.producten) + ' producten, ' + N(f.metInkoop) + ' met inkoop, ' + (f.orders || []).length + ' bestellingen, ' + N(f.betaald) + ' betaald, ' + N(f.metHj) + ' met kenmerk' + (N(f.nagemeld) ? ', ' + N(f.nagemeld) + ' nagemeld' : '') : 'HTTP ' + f.status + (f.status === 403 ? ' (sleutel klopt niet)' : '') + ', laatst geprobeerd ' + nl(f.at)) + '.');
  r.push('- **Route:** ' + N(l.direct && l.direct.pct) + '% direct naar de productpagina; cm.js op yoo.rs ' + (l.meet && l.meet.aan ? 'meet (laatst ' + nl(l.meet.laatst) + ')' : 'meet niet') + '.');
  if (l.pa) { r.push('- **PropellerAds-lus:** laatste ronde ' + nl(l.pa.at) + (l.pa.saldo != null ? ', saldo $' + N(l.pa.saldo).toFixed(2) + (N(l.pa.saldo) < 150 ? ' (onder de grens van $150)' : '') : '') + (l.pa.samenvatting ? '. ' + String(l.pa.samenvatting).slice(0, 300) : '') + '.');
    const cs = (l.pa.campagnes || []).filter(c => N(c.kliksVandaag) || N(c.kostenVandaag) || String(c.status) === '6').slice(0, 30);
    if (cs.length) { r.push('', '| PropellerAds-campagne | status | kliks vandaag | kosten vandaag |', '|---|---|---|---|'); for (const c of cs) r.push('| ' + c.id + ' ' + String(c.naam || '').replace(/\|/g, '/').replace(/^\[In-Page\] SHOP-LUS /, '').slice(0, 60) + ' | ' + (c.status ?? '') + ' | ' + N(c.kliksVandaag) + ' | $' + N(c.kostenVandaag).toFixed(2) + ' |'); r.push(''); } }
  if (l.md) r.push('- **Mondiad-lus:** laatste ronde ' + nl(l.md.at) + (l.md.saldo != null ? ', saldo $' + N(l.md.saldo).toFixed(2) + (N(l.md.saldo) < 40 ? ' (onder de grens van $40)' : '') : '') + (l.md.samenvatting ? '. ' + String(l.md.samenvatting).slice(0, 300) : '') + '.');
  r.push('- **Catalogus:** ' + N(l.catalogus) + ' producten; marge bekend van ' + N(l.marge) + '.');
  if (l.geheugen) r.push('- **Database:** ' + l.geheugen + ' in gebruik.');
  r.push('', 'Per uur met rode lekken: `/api/shop/lekken?k=<Babita\'s link>`. Trechter: `/api/shop/trechter`. Datapagina testen: `/api/shop/feedcheck`.', '');
  return r.join('\n');
}

// Heel kleine markdown naar HTML (koppen, lijsten, tabellen, vet, code, links), genoeg voor deze pagina.
export function mdHtml(md, esc) {
  const inl = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>');
  const uit = []; let lijst = null, tabel = null;
  const sluit = () => { if (lijst) { uit.push('</' + lijst + '>'); lijst = null; } if (tabel) { uit.push('</table></div>'); tabel = null; } };
  for (const regel of String(md).split('\n')) {
    let m;
    if (/^\|/.test(regel)) { const cel = regel.replace(/^\||\|$/g, '').split('|').map(x => x.trim()); if (cel.every(c => /^-+$/.test(c))) continue; if (!tabel) { sluit(); tabel = 1; uit.push('<div class="tw"><table><tr>' + cel.map(c => '<th>' + inl(c) + '</th>').join('') + '</tr>'); } else uit.push('<tr>' + cel.map(c => '<td>' + inl(c) + '</td>').join('') + '</tr>'); continue; }
    if ((m = /^(#{1,3}) (.*)$/.exec(regel))) { sluit(); const n = m[1].length; uit.push('<h' + n + '>' + inl(m[2]) + '</h' + n + '>'); continue; }
    if ((m = /^\s*- (.*)$/.exec(regel))) { if (lijst !== 'ul') { sluit(); lijst = 'ul'; uit.push('<ul>'); } uit.push('<li>' + inl(m[1]) + '</li>'); continue; }
    if ((m = /^\d+\. (.*)$/.exec(regel))) { if (lijst !== 'ol') { sluit(); lijst = 'ol'; uit.push('<ol>'); } uit.push('<li>' + inl(m[1]) + '</li>'); continue; }
    sluit(); if (regel.trim()) uit.push('<p>' + inl(regel) + '</p>');
  }
  sluit(); return uit.join('\n');
}

export function overdrachtPagina(live, md, esc) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Overdracht Yoors Shop</title>
<style>:root{--ink:#10131a;--ink-2:#3c4350;--ink-3:#6b7280;--line:#e4e7ec;--bg:#fff;--bg-2:#f7f8fa;--acc:#1e3a8a}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--ink:#f3f5f8;--ink-2:#c3c9d4;--ink-3:#8d95a3;--line:#262b36;--bg:#0c0e13;--bg-2:#13161d;--acc:#a5b4fc}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 1rem/1.6 ui-sans-serif,-apple-system,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif}main{max-width:52rem;margin:0 auto;padding:24px 16px 56px}
h1{font-size:1.9rem;letter-spacing:-.02em;margin:0 0 10px}h2{font-size:1.3rem;margin:34px 0 10px}h3{font-size:1.05rem}a{color:var(--acc);overflow-wrap:anywhere}code{font-size:.9em;background:var(--bg-2);padding:1px 4px;border-radius:4px;overflow-wrap:anywhere}
li{margin:4px 0}.live{border:1px solid var(--line);border-left:4px solid var(--acc);border-radius:12px;background:var(--bg-2);padding:4px 18px 10px;margin:18px 0 8px}
.tw{overflow-x:auto;border:1px solid var(--line);border-radius:10px;margin:8px 0}table{border-collapse:collapse;width:100%;font-size:.875rem}th,td{padding:6px 9px;border-bottom:1px solid var(--line);text-align:left}th{color:var(--ink-3);background:var(--bg)}</style></head><body><main>
<div class="live">${mdHtml(live, esc)}</div>
${mdHtml(md, esc)}
</main></body></html>`;
}
