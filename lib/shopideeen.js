// Leesbare pagina voor Henkjan en Babita (22 okt 2026, Henkjan: "Geef ook een pagina die leesbaar is voor ons"):
// de zes bezoekersblokken (Babita-taken 10 tot 15 in lib/shopprompt.js) in gewone taal, met de live meting van cm.js.
// Alleen totalen, geen sleutels, geen persoonsgegevens.

export const IDEEEN = [
  { nr: 10, titel: 'Verder waar je was', ziet: 'Wie terugkomt, ziet bovenaan de producten die hij al bekeek en zijn winkelwagen. Is de prijs intussen gezakt, dan staat het echte oude en nieuwe bedrag erbij.',
    waarom: 'Opnieuw zoeken kost moeite, en een keuze die je half gemaakt had, wil je afmaken. Wat je al gekozen had, voelt al een beetje van jou. Een derde tot de helft van de bezoekers komt binnen 10 minuten terug.',
    grens: 'Alleen op het toestel van de bezoeker (geen account, niets naar anderen). Met één kruisje weg en gewist. Een prijsstijging wordt niet als nieuws gebracht.',
    meet: [['vz', 'balk gezien'], ['vw', 'tik op een product of de winkelwagen']] },
  { nr: 11, titel: 'Echte drukte', ziet: 'Onder de prijs één regel als "18 mensen bekeken dit vandaag" of "3 keer besteld deze week". In de lijst een label "Populair deze week" bij de best verkopende producten.',
    waarom: 'Bij een winkel die je niet kent, kijk je wat anderen doen. Echte cijfers geven vertrouwen.',
    grens: 'Alleen echte tellingen, bots eruit, naar beneden afgerond. Onder 10 bekeken of 2 bestellingen tonen we niets. Nooit "nog maar 2" als dat niet de echte voorraad is.',
    meet: [['dr', 'regel gezien']] },
  { nr: 12, titel: 'Anderen kozen ook', ziet: 'Onder de koopknop hooguit vier producten die bezoekers van dit product ook bekeken, bewaarden of kochten.',
    waarom: 'Te veel keuze doet mensen afhaken. Een korte lijst van wat vergelijkbare bezoekers echt kozen, maakt kiezen makkelijk.',
    grens: 'Elke nacht berekend uit echt gedrag (bestellingen tellen zwaarder). Te weinig gegevens: aanvullen met dezelfde categorie en prijs, niet met wat de meeste marge heeft.',
    meet: [['og', 'tik op een van de vier']] },
  { nr: 13, titel: 'Zekerheid bij twijfel', ziet: 'Wie op Bestellen tikt maar niet doorgaat, ziet één keer een rustig blok bij de knop: totaalprijs met verzending, levertijd als datum, 14 dagen bedenktijd, iDEAL, verzonden vanuit NL.',
    waarom: 'Wie twijfelt, twijfelt meestal over de totaalprijs, de levertijd of het risico. Verlies weegt zwaarder dan winst; dus nemen we het risico weg met feiten.',
    grens: 'Geen pop-up over de pagina, geen klok, geen extra korting als lokmiddel. De hele prijs staat al op de productpagina, zodat er bij afrekenen niets bijkomt.',
    meet: [['zk', 'blok gezien'], ['kp', 'daarna op de afrekenpagina']] },
  { nr: 14, titel: 'Eerlijke set', ziet: 'Een bundel van producten die mensen echt samen kiezen, met het echte verschil ("samen €4,10 goedkoper"). Bij aantallen de prijs per stuk.',
    waarom: 'Mensen nemen vaak de voorgestelde optie en vergelijken met wat ze als eerste zien. Dat zetten we alleen in als de set de koper echt iets oplevert.',
    grens: 'Alleen als de set goedkoper is. De losse aankoop blijft de standaard en staat bovenaan. Niets vooraf aangevinkt.',
    meet: [['bu', 'bundel gezien'], ['bk', 'tik op de bundel'], ['vr', 'aantal of variant gekozen']] },
  { nr: 15, titel: 'Seintje op verzoek', ziet: 'Onder de koopknop een tekstlink "Stuur me een seintje bij een lagere prijs of als het weer op voorraad is". Eén veld: e-mail.',
    waarom: '"Laat het me weten" is een kleine, vrije stap. De bezoeker komt terug op het moment dat het voor hem beter is.',
    grens: 'Alleen als de bezoeker erom vraagt. Alleen een mail bij een echte daling van minstens 5% of als het weer leverbaar is, hooguit één per product, met afmeldlink, 90 dagen bewaard.',
    meet: [['pm', 'seintje aangezet']] },
];

export function ideeenPagina(tot = {}, { esc, k = '', datum = '' } = {}) {
  const e = esc || (s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
  const g = tot.gedrag || {}, geladen = Number(tot.geladen) || 0, N = v => Number(v) || 0;
  const kq = k ? '?k=' + encodeURIComponent(k) : '';
  const kaart = i => {
    const nieuw = i.meet.filter(([c]) => ['vz', 'vw', 'dr', 'og', 'zk', 'pm'].includes(c));
    const live = nieuw.length ? nieuw.some(([c]) => N(g[c]) > 0) : true;
    const rijen = i.meet.map(([c, l]) => '<li><b>' + N(g[c]) + '</b> ' + e(l) + (geladen && N(g[c]) ? ' <span class="zacht">(' + (Math.round(1000 * N(g[c]) / geladen) / 10) + '% van de bezoekers)</span>' : '') + '</li>').join('');
    return '<section class="kaart"><div class="kop"><span class="nr">Taak ' + i.nr + '</span><span class="status ' + (live ? 'aan' : 'uit') + '">' + (live ? 'gemeten' : 'nog niet gebouwd') + '</span></div><h2>' + e(i.titel) + '</h2>' +
      '<p><span class="lab">Wat de bezoeker ziet</span>' + e(i.ziet) + '</p><p><span class="lab">Waarom het werkt</span>' + e(i.waarom) + '</p><p class="grens"><span class="lab">Waar we eerlijk blijven</span>' + e(i.grens) + '</p>' +
      '<div class="meet"><span class="lab">Laatste 24 uur</span><ul>' + rijen + '</ul></div></section>';
  };
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Yoors bezoekersblokken</title>
<style>
:root{--bg:#f7f6f2;--kaart:#fff;--tekst:#1d1d1b;--zacht:#6b6a64;--lijn:#e4e2da;--accent:#1f6f5c;--uit:#9a6b12;--grensbg:#f1f6f4}
@media (prefers-color-scheme:dark){:root{--bg:#161615;--kaart:#20201e;--tekst:#ecebe6;--zacht:#a3a29b;--lijn:#33332f;--accent:#5fc3a6;--uit:#e0b04f;--grensbg:#1c2724}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tekst);font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:28px 16px 60px}h1{font-size:26px;margin:0 0 6px}.intro{color:var(--zacht);margin:0 0 22px}
.regels{background:var(--kaart);border:1px solid var(--lijn);border-radius:12px;padding:16px 18px;margin-bottom:22px}.regels h2{font-size:17px;margin:0 0 8px}.regels ul{margin:0;padding-left:20px}
.kaart{background:var(--kaart);border:1px solid var(--lijn);border-radius:12px;padding:18px;margin-bottom:16px}.kop{display:flex;justify-content:space-between;align-items:center;font-size:13px}
.nr{color:var(--zacht)}.status{padding:2px 9px;border-radius:99px;border:1px solid currentColor}.status.aan{color:var(--accent)}.status.uit{color:var(--uit)}
.kaart h2{font-size:20px;margin:6px 0 10px}.lab{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--zacht);margin-bottom:2px}
.kaart p{margin:0 0 12px}.grens{background:var(--grensbg);border-radius:8px;padding:10px 12px}.meet ul{margin:4px 0 0;padding-left:20px}.zacht{color:var(--zacht)}
.links a{color:var(--accent)}footer{color:var(--zacht);font-size:13px;margin-top:24px}
</style></head><body><main>
<h1>Bezoekers helpen met wat ze al deden</h1>
<p class="intro">Elke dag komen honderden mensen op de Yoors Shop en laten gedrag achter: wat ze bekijken, waar ze twijfelen, wat ze samen kiezen. Deze zes blokken geven dat terug aan de bezoeker zelf: minder zoeken, minder twijfel, een betere keuze. Stand ${e(datum)}, ${geladen} geladen productpagina's in de laatste 24 uur.</p>
<div class="regels"><h2>Spelregels voor alle zes</h2><ul>
<li>Alleen echte cijfers. Geen verzonnen aantallen, geen nepvoorraad, geen aftelklok, geen nepkorting.</li>
<li>Niets vooraf aangevinkt dat geld kost. Geen knoppen die een schuldgevoel geven.</li>
<li>Alles is met één tik weg te klikken.</li>
<li>Wat op het toestel van de bezoeker blijft, is een functie van de winkel. Wat naar een ander gaat, alleen met toestemming.</li>
<li>Elk blok wordt gemeten: gezien en getikt, per uur. Wat niet helpt, gaat eruit.</li></ul></div>
${IDEEEN.map(kaart).join('\n')}
<p class="links">Opdracht voor Claude Code: <a href="/api/shop/prompt${kq}">kant-en-klare prompt</a> · Meting per uur: <a href="/api/shop/lekken${kq}">lekkenpagina</a></p>
<footer>Gemeten door Clickmind (cm.js) op yoo.rs. Alleen totalen, geen persoonsgegevens.</footer>
</main></body></html>`;
}
