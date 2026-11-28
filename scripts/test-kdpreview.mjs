// Test voor lib/kdpreview.js (reviews KDP-boeken, 26 nov 2026). Draait zonder opslag: alleen de vaste logica en de pagina's.
import { writeFileSync, mkdirSync } from 'node:fs';
const R = await import('../lib/kdpreview.js');
let fout = 0; const ok = (c, t) => { if (!c) { fout++; console.log('FOUT', t); } };

// land -> juiste Amazon (verified purchase kan alleen waar gekocht is)
ok(R.reviewUrl('pitboss', 'CA') === 'https://www.amazon.ca/review/create-review?asin=B0BKRPL5JX', 'pitboss CA');
ok(R.reviewUrl('pitboss', 'US').startsWith('https://www.amazon.com/review'), 'pitboss US');
ok(R.reviewUrl('lc', 'GB').startsWith('https://www.amazon.co.uk/'), 'lc GB');
ok(R.reviewUrl('teens', 'NZ').startsWith('https://www.amazon.com.au/'), 'teens NZ');
ok(R.reviewUrl('advent', '').startsWith('https://www.amazon.de/'), 'DE-boek zonder land: thuismarkt');
ok(R.reviewUrl('advent', 'AT').startsWith('https://www.amazon.de/'), 'AT -> de');
ok(R.reviewUrl('pitboss', 'BR').startsWith('https://www.amazon.com/'), 'land zonder KDP print -> thuismarkt');
ok(R.reviewUrl('buero', 'DE') === 'https://www.amazon.de/review/create-review?asin=B0HSM844T2', 'buero live: reviewformulier');
R.BOEKEN.zonderasin = { m: 'de', asin: '', zoek: 'Testboek', titel: 'Testboek', taal: 'de' };
ok(R.reviewUrl('zonderasin', 'DE').includes('/s?k='), 'zonder ASIN: zoeken');
delete R.BOEKEN.zonderasin;
ok(R.reviewUrl('bestaatniet', 'US') === 'https://www.amazon.com/', 'onbekend boek');

// pagina's: bonus zonder voorwaarde, reviewvraag neutraal, geen sterren, geen gedachtestreepjes
const pag = { pitbossX: R.extraPagina('pitboss'), pitbossB: R.bonusPagina('pitboss'), lcX: R.extraPagina('lc'), lcB: R.bonusPagina('lc'), teens: R.extraPagina('teens'), adults: R.extraPagina('adults') };
for (const [k, h] of Object.entries(pag)) {
  ok(h && h.startsWith('<!doctype html>'), k + ' html');
  ok(!/[—–]/.test(h), k + ' geen gedachtestreepjes');
  ok(!/5[- ]?star|five[- ]star|★/i.test(h), k + ' geen sterren vragen');
  ok(!/in exchange|in ruil/i.test(h), k + ' niets in ruil');
}
ok(/type="email"/.test(pag.pitbossX) && /type="email"/.test(pag.lcX), 'bonus vraagt e-mailadres');
ok(!/type="email"/.test(pag.teens), 'teens: geen e-mailadres (lezers zijn tieners)');
ok(/\/r\/teens\?p=quiz/.test(pag.teens), 'teens quiz linkt naar review');
ok(/165°F/.test(pag.pitbossB) && /145°F/.test(pag.pitbossB) && /160°F/.test(pag.pitbossB), 'USDA-temperaturen');
ok(/Day 30/.test(pag.lcB), 'tracker 30 dagen');
ok(!/review/i.test(pag.pitbossX.split('<form')[0]), 'bonusbelofte noemt geen review');

// mail: neutraal, link naar review en afmelden
const m = R.mailTekst({ code: 'pitboss' }, { v: R.VARIANTEN[0], tok: 'abcDEF12345' });
ok(m.tekst.includes('https://whichtobuy.best/x/m/abcDEF12345/r') && m.stop.endsWith('/x/m/abcDEF12345/x'), 'mail links');
ok(/honest review/.test(m.tekst) && /Good or bad/.test(m.tekst), 'mail eerlijk, goed of slecht');
for (const v of R.VARIANTEN) { const t = R.mailTekst({ code: 'lc' }, { v, tok: 'x' }); ok(!/[—–]/.test(t.tekst + t.onderwerp) && !/5[- ]?star|five/i.test(t.tekst), 'variant schoon'); ok(!/\{[a-z]+\}/.test(t.tekst + t.onderwerp), 'variant volledig ingevuld'); }
ok(R.STROOM.LIVE === false, 'stroom staat uit tot verstuur');

// pagina's wegschrijven om te bekijken
mkdirSync('/tmp/kdprev', { recursive: true }); for (const [k, h] of Object.entries(pag)) writeFileSync('/tmp/kdprev/' + k + '.html', h);
console.log(fout ? fout + ' fouten' : 'kdpreview ok');
process.exit(fout ? 1 : 0);
