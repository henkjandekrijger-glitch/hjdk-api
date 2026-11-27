// Mailmind: welke bak krijgt de volgende mail (alleen rekenregels, geen database; test: node scripts/test-mailmind-bak.mjs).
// Henkjan 27 nov 2026: "zorg dat mail mind slimmer wordt en mijn account gmail niet gekilld".
//
// Een bak heet <kenmerk>|<kenmerk>|... (tk-mailchimp: score|soort adres|jaar). Tot 27 nov leerde elke bak apart en alleen op ja.
// 94 mails over 34 bakken zeggen per bak bijna niets, en een bak met ja's maar ook veel stops of bounces bleef gewoon mails krijgen
// (eigen domeinen: 4 ja, 10 stops en 2 bounces op 29 mails; gmail en hotmail: 5 ja, 1 stop en 0 bounces op 30).
//
// Nu:
// 1. Elk kenmerk leert mee. 30 mails naar gmail-adressen zeggen ook iets over een gmail-bak waar nog niets heen ging.
//    De verwachting van een bak is het gemiddelde van zijn kenmerken (zonder zijn eigen mails); daarna tellen zijn eigen cijfers erbij.
// 2. De keuze weegt drie kansen: een ja telt 1, een bounce -3 (Gmail telt elke harde bounce tegen het account van Henkjan),
//    een stop -0,5 (geen rem op het tempo bij een toestemmingsmail, maar wie stop klikt had de mail liever niet gehad).
//    Alleen de kans op ja wordt geloot (Thompson: zo blijft er iets te leren). De risico's tellen met hun verwachting, zonder geluk.
// 3. De bank: een kenmerk met 15 of meer mails en 10% of meer bounces gaat op de bank. Zijn bakken komen pas aan de beurt als de rest op is.
//
// Heeft een stroom bakken met één kenmerk en nog geen cijfers, dan is de uitkomst gelijk aan de oude regel (voorkennis plus eigen ja's).
const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export const PRIOR = [0.5, 9.5]; // verwachting 5% ja, gewicht 10 mails (een stroom geeft per bak eigen voorkennis met D.voorkennis(bak) = [a, b])
export const RISICO = { bounce: 3, stop: 0.5 };
export const ANKER = { gewicht: 4, bounce: 0.04, stop: 0.05 }; // zonder cijfers: 4% bounce en 5% stop verwacht, gewicht 4 mails per kenmerk
export const BANK = { min: 15, bounce: 0.10 };
const WAT = ['verstuurd', 'ja', 'stop', 'bounce'];
const delen = b => String(b).split('|');

// cijfers per kenmerk, opgeteld over alle bakken; de sleutel is <plek>:<kenmerk> (0:r4, 1:gratis, 2:2018)
export function kenmerken(stats) {
  const K = {};
  for (const [b, s] of Object.entries(stats || {})) delen(b).forEach((d, i) => { const o = K[i + ':' + d] = K[i + ':' + d] || { verstuurd: 0, ja: 0, stop: 0, bounce: 0 }; for (const w of WAT) o[w] += N(s && s[w]); });
  return K;
}

// welke kenmerken op de bank staan (te veel bounces); een bak met zo'n kenmerk wacht tot de rest op is
export const bank = K => Object.keys(K).filter(k => K[k].verstuurd >= BANK.min && K[k].bounce / K[k].verstuurd >= BANK.bounce).sort();
export const opDeBank = (b, K, B = bank(K)) => delen(b).some((d, i) => B.includes(i + ':' + d));

// wat we van een bak verwachten: ja als [a, b] voor de loting, bounce en stop als kans per mail
export function verwachting(b, stats, K, prior = () => PRIOR) {
  const s = (stats && stats[b]) || {}, d = delen(b), [pa, pb] = (prior && prior(b)) || PRIOR, M = pa + pb, v = N(s.verstuurd);
  const gem = (w, anker) => { let t = 0; d.forEach((x, i) => { const k = K[i + ':' + x] || {}; t += (Math.max(0, N(k[w]) - N(s[w])) + ANKER.gewicht * anker) / (Math.max(0, N(k.verstuurd) - v) + ANKER.gewicht); }); return t / d.length; };
  const mj = gem('ja', pa / M), mb = gem('bounce', ANKER.bounce), ms = gem('stop', ANKER.stop);
  return { ja: [M * mj + N(s.ja), M * (1 - mj) + Math.max(0, v - N(s.ja))], bounce: (M * mb + N(s.bounce)) / (M + v), stop: (M * ms + N(s.stop)) / (M + v) };
}

// de keuze: hoogste geloot ja min de risico's; bakken op de bank alleen als er niets anders meer is. beta = de loting (a, b) => kans
export function kiesBak(stats, kansen, prior = () => PRIOR, beta) {
  const K = kenmerken(stats), B = bank(K), vrij = kansen.filter(b => !opDeBank(b, K, B)), L = vrij.length ? vrij : kansen;
  let best = null, bv = -Infinity;
  for (const b of L) { const w = verwachting(b, stats, K, prior), x = beta(w.ja[0], w.ja[1]) - RISICO.bounce * w.bounce - RISICO.stop * w.stop; if (x > bv) { bv = x; best = b; } }
  return best;
}

// voor de stand: per kenmerk de cijfers in procenten en of het op de bank staat
export function kenmerkStand(stats) {
  const K = kenmerken(stats), B = bank(K), pct = (a, n) => n ? Math.round(1000 * a / n) / 10 : null, o = {};
  for (const k of Object.keys(K).sort()) { const x = K[k]; if (!x.verstuurd) continue; o[k] = { ...x, jaPct: pct(x.ja, x.verstuurd), stopPct: pct(x.stop, x.verstuurd), bouncePct: pct(x.bounce, x.verstuurd), ...(B.includes(k) ? { bank: true } : {}) }; }
  return { perKenmerk: o, bank: B };
}

// dagrem op bounces (Gmail beschermen): 4 of meer bounces vandaag en dat is 6% of meer van wat vandaag de deur uit ging
// (gerekend op minstens 20 mails, zodat een bounce van gisteravond de ochtend niet stillegt): vandaag niets meer uit deze stroom.
export const DAGREM = { min: 4, deel: 0.06, vloer: 20 };
export const dagRem = (bounces, verstuurd) => N(bounces) >= DAGREM.min && N(bounces) / Math.max(DAGREM.vloer, N(verstuurd)) >= DAGREM.deel;
