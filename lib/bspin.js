// Lerend posten op Pinterest voor bookstuffers.com en lastingchange.works (Henkjan 22 nov 2026: "Ga voor pinterest . En blijf dat lerende
// posten voor deze site iedere dag . !", "pinterest kan gewoon in kadoly account van pinterest met boeken board").
// Account: Pinterest kadolyshop via Zernio (account 6afb8a5d86e8bb18f844fc95), vier Engelse borden (BORD).
// Elke dag kiest pinPlan() een paar pins: per haak (kop en tekst) een score uit de gemeten uitkomst (uitgaande kliks per pin, saves),
// met verkenning, zodat wat werkt vaker komt en nieuwe haken een kans krijgen. Elke pin heeft een eigen beeld (1000x1500, fn/bs.js op=pinbeeld)
// en linkt naar de eigen pagina (nooit direct naar Amazon) met utm_content=<pin-id>, zodat Clickmind de bezoeker volgt.
import { BOEKEN, ANDER, LC } from './bs-data.js';

export const ACCOUNT = '6afb8a5d86e8bb18f844fc95';
export const BORD = { we: '271060540011963291', sok: '271060540011963292', lc: '271060540011963293', bijbel: '271060540011963294' };
const BS = 'https://stockingbooks.com', LCW = 'https://lastingchange.works';
const vind = a => [...BOEKEN, ...ANDER, LC].find(b => b.a === a);
const usd = p => '$' + (Number.isInteger(p) ? p : Number(p).toFixed(2));

// Haken: id (nooit wijzigen, de uitkomst hangt eraan), bord, boeken, kop op het beeld (kort), pintitel (zoekterm voorop), tekst en doel.
export const HAKEN = [
  { id: 'we-ruzie', bord: 'we', boeken: ['B0DNCLDHD6', 'B0DNDQZ3G3', 'B0DP4TNQ3P', 'B0DNQDHQ7X', 'B0DNN75C5Z'], kop: b => `The ${usd(b.p)} white elephant gift everyone tries to steal`, titel: b => `White elephant gift under $5: ${b.t}`, tekst: b => `Funny white elephant gift idea under $5: ${b.t}, a ${b.n}-page bathroom word search. Flat to wrap, nobody guesses it, and it gets a laugh when it is opened. White elephant gift ideas, gag gift, Yankee swap, Dirty Santa.`, doel: () => `${BS}/white-elephant-gifts-under-10` },
  { id: 'we-dad', bord: 'we', boeken: ['B0DK3CSYXW'], kop: () => '400 dad jokes nobody asked for', titel: () => 'White elephant gift for men: 400 dad jokes', tekst: b => `Dad Jokes You Never Asked For: 400 jokes in ${b.n} pages for ${usd(b.p)}. The groan-out-loud white elephant gift for men, dads and coworkers. White elephant gifts for men under $10.`, doel: () => `${BS}/white-elephant-gifts-under-10` },
  { id: 'we-onder10', bord: 'we', boeken: ['B0DJQS1K5Z', 'B0DK3CSYXW', 'B0DP42FXB1', 'B0DMP31FSP'], kop: () => 'Funny white elephant gifts under $10', titel: () => 'Funny white elephant gift ideas under $10', tekst: b => `${b.t}: ${usd(b.p)}, ${b.n} pages. One of 20 funny small books for a white elephant gift exchange with a $5 or $10 limit. White elephant gift ideas for adults, coworkers and family.`, doel: () => `${BS}/white-elephant-gifts-under-10` },
  { id: 'we-regels', bord: 'we', boeken: ['B0DNQ61ZJM'], kop: () => 'White elephant rules in 8 steps (free printable)', titel: () => 'White elephant rules: how to play + free printable', tekst: () => 'The white elephant gift exchange rules in 8 steps, a rules card to print and a free number picker for the playing order. How many steals, when a gift is frozen and how the last turn works.', doel: () => `${BS}/white-elephant-rules` },
  { id: 'sok-haar', bord: 'sok', boeken: ['B0DMQKR5QZ', 'B0DMR1MSSK', 'B0DNZCW56W', 'B0DMFBPQG3', 'B0DMFSY1LR'], kop: b => `Stocking stuffer for her under ${usd(Math.ceil(b.p))}`, titel: b => `Stocking stuffer for women: ${b.t}`, tekst: b => `${b.t}: ${usd(b.p)}, ${b.n} pages, fits in her stocking. Stocking stuffer ideas for women, mom, wife and grandma.`, doel: () => `${BS}/stocking-stuffers#for-her` },
  { id: 'sok-hem', bord: 'sok', boeken: ['B0HRGNJ7CY', 'B0DMP31FSP', 'B0DK3CSYXW'], kop: b => `Stocking stuffer for the man who has everything`, titel: b => `Stocking stuffer for men: ${b.t}`, tekst: b => `${b.t}: ${usd(b.p)}, ${b.n} pages. Stocking stuffer ideas for men, dad, husband and grandpa who have everything.`, doel: () => `${BS}/stocking-stuffers#for-him` },
  { id: 'sok-tiener', bord: 'sok', boeken: ['B0DJQLBM75'], kop: () => '408 facts teens actually read', titel: () => 'Stocking stuffer for teens: 408 weird and funny facts', tekst: b => `Stocking Stuffers For Teens: 408 weird, smart and funny facts, ${b.n} pages, ${usd(b.p)}. Rated ${b.r} out of 5 by ${b.c} readers on Amazon. Stocking stuffer ideas for teen boys and girls.`, doel: () => `${BS}/stocking-stuffers#for-kids-and-teens` },
  { id: 'sok-puzzel', bord: 'sok', boeken: ['B0DMZTBX4C', 'B0DMTCBGQ2', 'B0DMNK1J5T', 'B0DN65PRD9'], kop: b => `Christmas puzzles for a quiet morning, ${usd(b.p)}`, titel: b => `Christmas stocking stuffer: ${b.t}`, tekst: b => `${b.t}: ${usd(b.p)}, ${b.n} pages of Christmas puzzles. Stocking stuffer for adults and seniors, plus 3 free printable Christmas word search puzzles on our site.`, doel: () => `${BS}/free-printable-christmas-word-search` },
  { id: 'ss-gen', bord: 'we', boeken: ['B0DK3CSYXW', 'B0DNCLDHD6'], kop: () => 'Free Secret Santa generator: draw names in seconds', titel: () => 'Free Secret Santa generator: draw names, private links', tekst: () => 'Draw names for Secret Santa for free: keep couples apart, set a budget and send everyone a private link with their match and gift ideas under the budget. No sign-up, no emails.', doel: () => `${BS}/secret-santa-generator` },
  { id: 'we-ideeen', bord: 'we', boeken: ['B0DNQ128JZ', 'B0DNB1T9JT', 'B0DP42FXB1'], kop: () => 'White elephant gifts people actually steal', titel: () => 'White elephant gift ideas by price: under $5, $10, $25', tekst: b => `Funny white elephant gift ideas by price limit, plus the steal test: does it get a laugh, would people use it, can nobody guess it? Starring ${b.t}, ${usd(b.p)}.`, doel: () => `${BS}/white-elephant-gift-ideas` },
  { id: 'sok-gids-haar', bord: 'sok', boeken: ['B0DMNGLKLT', 'B0DNZFN43H', 'B0DMFBPQG3'], kop: () => 'Stocking stuffers for women she will actually use', titel: () => 'Stocking stuffers for women: ideas by price from $5', tekst: b => `Stocking stuffer ideas for women, mom and wife from $5 and under to $25, the five-slot rule and a free budget planner. Featured: ${b.t}, ${usd(b.p)}.`, doel: () => `${BS}/stocking-stuffers-for-women` },
  { id: 'sok-gids-hem', bord: 'sok', boeken: ['B0HRGNJ7CY', 'B0DMP31FSP'], kop: () => 'Stocking stuffers for men who have everything', titel: () => 'Stocking stuffers for men: ideas from $5 to $25', tekst: b => `Stocking stuffer ideas for men, dad and husband: useful, edible or funny. The five-slot rule and a budget planner. Featured: ${b.t}, ${usd(b.p)}.`, doel: () => `${BS}/stocking-stuffers-for-men` },
  { id: 'lc-jaar', bord: 'lc', boeken: [LC.a], kop: () => 'Don’t throw away another year.', titel: () => 'How to stick to New Year’s resolutions: one habit, 30 days', tekst: () => `Did nothing this year? The Lasting Change Workbook: one habit, start tiny, a bad-day plan and a two-minute daily check-in for 30 days. Rated ${LC.r} out of 5 by ${LC.c} readers on Amazon. New Year's resolution ideas that stick.`, doel: () => `${LCW}/` },
  { id: 'lc-66', bord: 'lc', boeken: [LC.a], kop: () => 'A habit takes 66 days, not 21', titel: () => 'How long does it take to form a habit? 66 days', tekst: () => 'In a 2010 study by Lally and colleagues, a new habit took a median of 66 days to feel automatic. Six steps to make a New Year’s resolution stick, and a workbook that runs to day 66.', doel: () => `${LCW}/how-to-stick-to-new-years-resolutions` },
  { id: 'lc-stappen', bord: 'lc', boeken: [LC.a], kop: () => '6 steps to make a resolution stick', titel: () => 'New Year’s resolutions that stick: 6 steps', tekst: () => 'Pick one habit, start it so small you cannot say no, tie it to something you already do, plan the bad day, check in daily and give it 66 days. New Year goals, habit tracker ideas.', doel: () => `${LCW}/how-to-stick-to-new-years-resolutions` },
  { id: 'enoch-wat', bord: 'bijbel', boeken: ['B0B5KV79N1'], kop: () => 'What is the Book of Enoch?', titel: () => 'What is the Book of Enoch? 1, 2 and 3 Enoch explained', tekst: () => 'The Book of Enoch explained: who wrote it, the Watchers and the giants, why Jude 1:14-15 quotes it, why it is not in the Bible, and how 1, 2 and 3 Enoch differ.', doel: () => `${BS}/book-of-enoch` },
  { id: 'apo-14', bord: 'bijbel', boeken: ['B0DDBTXC9J'], kop: () => 'The 14 books left out of the Bible', titel: () => 'What is the Apocrypha? The books left out of the Bible', tekst: () => 'The 14 books of the King James Apocrypha: Tobit, Judith, Wisdom, Sirach, Maccabees and more. Which Bibles include them and why Protestant Bibles left them out.', doel: () => `${BS}/apocrypha` },
];

// Het boeklog is de gedeelde bron voor bekende plaatsingen. t is registratietijd:
// die gebruiken we conservatief; ongeldige/toekomstige tijden blokkeren het product.
// Dit reserveert geen slot en vervangt geen providercontrole vóór publicatie.
export const PIN_AFKOELING_DAGEN = 14;
export function boekenInAfkoeling(log = [], nu = Date.now()) {
  if (!Array.isArray(log) || !Number.isFinite(nu)) throw new TypeError('ongeldige pinhistorie of meettijd');
  const sinds = nu - PIN_AFKOELING_DAGEN * 864e5, uit = new Set();
  for (const x of log) {
    if (!x || !/^[A-Z0-9]{10}$/.test(x.a || '')) continue;
    const t = Date.parse(x.t);
    if (!Number.isFinite(t) || t > sinds) uit.add(x.a);
  }
  return uit;
}

// gisteren blijft voor bestaande aanroepers geldig; log bewaakt alle bekende 14 dagen.
export function pinPlan(stand = {}, { aantal = 4, gisteren = [], log = [], nu = Date.now(), rnd = Math.random } = {}) {
  const uitgesloten = boekenInAfkoeling(log, nu);
  for (const a of gisteren) uitgesloten.add(a);
  const score = h => { const s = stand[h.id] || {}; const p = s.pins || 0, k = (s.klik || 0) + 0.3 * (s.saves || 0); return (k + 1) / (p + 2) + rnd() * 0.35 + (p === 0 ? 0.5 : 0); };
  const gekozen = [], perBord = {};
  for (const h of [...HAKEN].sort((a, b) => score(b) - score(a))) {
    if (gekozen.length >= aantal) break;
    if ((perBord[h.bord] || 0) >= 2) continue;
    const kandidaten = h.boeken.map(vind).filter(Boolean).filter(b => !uitgesloten.has(b.a));
    if (!kandidaten.length) continue; // nooit terugvallen op een uitgesloten product
    const b = kandidaten[Math.floor(rnd() * kandidaten.length)];
    perBord[h.bord] = (perBord[h.bord] || 0) + 1;
    uitgesloten.add(b.a); // dezelfde ASIN niet via een andere haak opnieuw kiezen
    const id = `${new Date(nu).toISOString().slice(0, 10).replace(/-/g, '')}-${h.id}-${b.a.slice(-4).toLowerCase()}`;
    const doel = h.doel(b), sep = doel.includes('?') ? '&' : (doel.includes('#') ? null : '?');
    const link = sep ? doel + sep + `utm_source=pinterest&utm_content=${id}` : doel.replace('#', `?utm_source=pinterest&utm_content=${id}#`);
    gekozen.push({ id, haak: h.id, a: b.a, bord: BORD[h.bord], titel: h.titel(b).slice(0, 100), tekst: h.tekst(b).slice(0, 480), link, beeld: `${BS}/pin/${b.a}-${h.id}.png`, kop: h.kop(b) });
  }
  return gekozen;
}
export const haakVan = id => HAKEN.find(h => h.id === id);
export { vind };
