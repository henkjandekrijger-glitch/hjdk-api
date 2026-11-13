// WAM matchflow (Henkjan 13 nov 01:47 UTC): "Ontwerp matching systeem zodat je ook de juiste vragen stelt bij iedere supply en of ieder demand !! Het moet veel
// beter dan nu en mensen moeten meteen begrijpen dat het daarom goed werkt. Ik denk trouwens dat het allemaal pills zijn die uit elkaar volgen. En zo hoef je bijna
// alleen maar te klikken." en "train zodat je steeds minder AI gaat gebruiken".
// Eén indeling voor vraag en aanbod: categorie -> soort -> waar -> wanneer -> prijs, elke stap pills. Vraag en aanbod hebben dezelfde velden, dus matchen is
// vergelijken: zelfde categorie en soort, zelfde stad (of 'in de buurt'), passende tijd en prijs. Bij elke match staat waarom hij past.
// Trefwoorden per soort zijn uit te breiden zonder uitrol (wam:flowkw, op=flowkw): elke halfuurronde voegt woorden toe uit wat de regels niet snapten (wam:ucvrij).

const L = (en, nl) => ({ en, nl });
export const TAX = {
  woning: { soort: 'woning', kw: 'room|rooms|kamer|apartment|appartement|flat|studio|condo|basement|house to rent|place to live|woning|woonruimte|sublet|roommate|huisgenoot|to rent|te huur',
    kant: { zoekt: L('I\'m looking for a place', 'Ik zoek woonruimte'), biedt: L('I have a place to rent', 'Ik verhuur woonruimte') },
    sub: { kamer: [L('Room in a shared house', 'Kamer in een gedeeld huis'), 'room|kamer|shared|roommate|huisgenoot'], studio: [L('Private room or studio', 'Eigen kamer of studio'), 'studio|private room|basement|eigen kamer'], appartement: [L('Apartment or house', 'Appartement of huis'), 'apartment|appartement|flat|condo|house|huis'], kort: [L('Short stay', 'Kort verblijf'), 'short|sublet|tijdelijk|few weeks|paar weken|airbnb'] },
    vragen: ['sub', 'area', 'prijs', 't'], prijs: [800, 1200, 1800], perMaand: true, t: ['nu', 'maand', 'later', 'flex'] },
  werk: { soort: 'baan', kw: 'job|jobs|work|werk|baan|hiring|staff|personeel|shift|shifts|gig|gigs|vacature|employee|worker|earn|bijverdienen|extra money',
    kant: { zoekt: L('I\'m looking for work', 'Ik zoek werk'), biedt: L('I\'m hiring', 'Ik zoek personeel') },
    sub: { winkel: [L('Retail or food', 'Winkel of horeca'), 'retail|store|shop|cashier|restaurant|cafe|kitchen|cook|server|barista|food|horeca|winkel|kassa|keuken'], magazijn: [L('Warehouse or driving', 'Magazijn of rijden'), 'warehouse|driver|driving|delivery|forklift|logistics|magazijn|chauffeur|bezorg'], zorg: [L('Cleaning or care', 'Schoonmaak of zorg'), 'cleaning|cleaner|care|caregiver|nurse|janitor|schoonmaak|zorg|verpleeg'], kantoor: [L('Office or admin', 'Kantoor of administratie'), 'office|admin|reception|assistant|accounting|kantoor|administratie|receptie'], bouw: [L('Trades or construction', 'Bouw of techniek'), 'construction|trades|carpenter|electrician|plumber|painter|labour|labor|bouw|timmerman|schilder'], online: [L('Tech or online', 'Tech of online'), 'developer|software|it|online|remote|design|marketing|social media|programm'], klus: [L('Gigs and odd jobs', 'Losse klussen'), 'gig|gigs|odd job|side|extra money|bijverdienen|klus'] },
    vragen: ['sub', 'area', 'uren'], uren: ['vol', 'deel', 'klus', 'flex'] },
  dienst: { soort: 'dienst', kw: 'service|services|help|a hand|repair|fix|plumber|electrician|cleaner|cleaning|handyman|moving|movers|tutor|lessons|hair|nails|babysit|dog walk|pet|mechanic|dienst|hulp|klus|loodgieter|elektricien|schoonmaker|verhuis|bijles|kapper|oppas',
    kant: { zoekt: L('I need a service', 'Ik zoek een dienst'), biedt: L('I offer a service', 'Ik bied een dienst') },
    sub: { klus: [L('Handyman or repairs', 'Klusjes of reparatie'), 'handyman|repair|fix|assemble|mount|ikea|klusjes|reparatie|klus'], loodgieter: [L('Plumber', 'Loodgieter'), 'plumber|plumbing|leak|pipe|toilet|drain|loodgieter|lekkage'], elektricien: [L('Electrician', 'Elektricien'), 'electrician|electric|wiring|outlet|elektricien|stroom'], schoonmaak: [L('Cleaning', 'Schoonmaak'), 'clean|cleaning|cleaner|maid|schoonma'], verhuis: [L('Moving or delivery', 'Verhuizen of bezorgen'), 'moving|movers|move|delivery|van|truck|verhuis|bezorg|busje'], les: [L('Tutoring or lessons', 'Bijles of lessen'), 'tutor|tutoring|lesson|lessons|teach|class|bijles|les|coach'], beauty: [L('Hair or beauty', 'Haar of beauty'), 'hair|barber|nails|makeup|beauty|lashes|kapper|nagels'], oppas: [L('Childcare or pets', 'Oppas of huisdieren'), 'babysit|nanny|childcare|kids|dog|pet|cat|walk|oppas|hond|kinderopvang'], it: [L('Phone, computer or IT', 'Telefoon, computer of IT'), 'computer|laptop|phone repair|phones|iphone|screen repair|tablet|tech support|it support|website|wifi|printer|telefoon|computer|scherm'], auto: [L('Car help', 'Auto'), 'car|mechanic|tire|tyre|oil change|auto|monteur|band'] },
    vragen: ['sub', 'area', 't', 'prijs'], prijs: [50, 150, 500], t: ['vandaag', 'week', 'maand', 'flex'] },
  // geven (Henkjan 13 nov 13:08 UTC: "test ook buy nothing idee als usecase gewoon ruilen. MAAR dan ruil je niet met gelijke waarde maar met het systeem: iemand kan iets halen bij je is +1 en jij kan bij iemand anders iets halen is -1. We kijken alleen naar geven niet naar de waarde.")
  geven: { soort: 'iets', geven: true, kw: 'give away|giving away|to give|for free|free stuff|something free|anything free|free|gratis|weggeven|geef weg|geven|buy nothing|swap|ruilen|ruil',
    kant: { zoekt: L('I\'d like something for free', 'Ik wil iets gratis ophalen'), biedt: L('I\'m giving something away', 'Ik geef iets weg') },
    sub: { meubels: [L('Furniture', 'Meubels'), 'furniture|sofa|couch|bed|table|chair|desk|dresser|mattress|meubel|bank|tafel|stoel|kast|matras'], kleding: [L('Clothing or shoes', 'Kleding of schoenen'), 'clothes|clothing|shoes|jacket|dress|sneakers|kleding|schoenen|jas'], kinderen: [L('Kids and baby', 'Kinderen en baby'), 'baby|stroller|kids|toys|crib|kinderwagen|speelgoed'], huis: [L('Home and kitchen', 'Huis en keuken'), 'garden|tools|kitchen|appliance|pan|plates|lamp|tuin|gereedschap|keuken|servies'], elektronica: [L('Electronics', 'Elektronica'), 'phone|laptop|tv|console|tablet|camera|cable|charger|electronics|elektronica|telefoon'], eten: [L('Food', 'Eten'), 'food|bread|vegetables|meal|leftover|eten|brood|groente|maaltijd'], boeken: [L('Books and games', 'Boeken en spellen'), 'book|books|game|games|puzzle|boek|boeken|spel|spellen'], planten: [L('Plants', 'Planten'), 'plant|plants|cutting|seeds|plant|planten|stekje|zaden'] },
    vragen: ['sub'] },
  spullen: { soort: 'iets', kw: 'buy|sell|selling|for sale|give away|giving away|free|second hand|used|koop|kopen|verkoop|verkopen|weggeven|gratis|tweedehands',
    kant: { zoekt: L('I want to buy something', 'Ik wil iets kopen'), biedt: L('I\'m selling or giving away', 'Ik verkoop of geef weg') },
    sub: { meubels: [L('Furniture', 'Meubels'), 'furniture|sofa|couch|bed|table|chair|desk|dresser|mattress|meubel|bank|tafel|stoel|kast|matras'], elektronica: [L('Electronics or phones', 'Elektronica of telefoons'), 'phone|iphone|samsung|laptop|tv|console|playstation|xbox|tablet|camera|electronics|elektronica|telefoon'], kleding: [L('Clothing or shoes', 'Kleding of schoenen'), 'clothes|clothing|shoes|jacket|dress|sneakers|kleding|schoenen|jas'], vervoer: [L('Car, bike or scooter', 'Auto, fiets of scooter'), 'car|bike|bicycle|scooter|e-bike|motor|auto|fiets'], kinderen: [L('Kids and baby', 'Kinderen en baby'), 'baby|stroller|kids|toys|crib|kinderwagen|speelgoed'], huis: [L('Home and garden', 'Huis en tuin'), 'garden|tools|kitchen|appliance|fridge|washer|tuin|gereedschap|keuken|koelkast|wasmachine'], tickets: [L('Tickets', 'Tickets'), 'ticket|tickets|concert|game|show|kaartjes'] },
    vragen: ['sub', 'area', 'prijs'], prijs: [0, 50, 200, 1000] },
  rit: { soort: 'dienst', kw: 'ride|rides|lift|carpool|commute|airport|drive me|meerijden|rit|vervoer',
    kant: { zoekt: L('I need a ride', 'Ik zoek een lift'), biedt: L('I can offer rides', 'Ik bied ritten aan') },
    sub: { woonwerk: [L('Daily commute', 'Woon-werk'), 'commute|work|daily|woon-werk'], reis: [L('One trip', 'Eén rit'), 'trip|once|city|reis'], vliegveld: [L('Airport', 'Vliegveld'), 'airport|vliegveld|schiphol|pearson'], busje: [L('Van for moving', 'Busje om te verhuizen'), 'van|truck|move|busje'] },
    vragen: ['sub', 'area', 't'], t: ['vandaag', 'week', 'vast', 'flex'] },
  mensen: { soort: 'iemand', kw: 'friends|meet|people|buddy|partner to|teammates|language|new in town|vrienden|ontmoeten|maatje|samen sporten|nieuw in',
    kant: { zoekt: L('I want to meet people', 'Ik wil mensen ontmoeten'), biedt: L('I want to meet people', 'Ik wil mensen ontmoeten') },
    sub: { sport: [L('Sports or gym', 'Sport'), 'sport|gym|run|running|soccer|football|basketball|tennis|padel|hike|sporten|hardlopen'], koffie: [L('Coffee or walks', 'Koffie of wandelen'), 'coffee|walk|walks|chat|koffie|wandel'], taal: [L('Language exchange', 'Taal oefenen'), 'language|english|french|spanish|dutch|taal'], geloof: [L('Faith or community', 'Geloof of buurt'), 'church|mosque|faith|community|volunteer|kerk|vrijwilliger'], ouders: [L('Parents and kids', 'Ouders en kinderen'), 'parents|mom|dad|kids|playdate|ouders|kinderen'], gamen: [L('Gaming', 'Gamen'), 'gaming|games|game night|board games|gamen'], muziek: [L('Music or arts', 'Muziek of kunst'), 'music|band|jam|art|paint|muziek|kunst'], nieuw: [L('New in town', 'Nieuw in de stad'), 'new in town|new here|just moved|nieuw in|net verhuisd'] },
    vragen: ['sub', 'area', 't'], t: ['doordeweeks', 'avond', 'weekend', 'flex'], symmetrisch: true },
};
// start: lerende tikoptie op het beginscherm -> kant, categorie, eventueel al een soort of prijs
export const START = { kamer_z: ['zoekt', 'woning'], kamer_b: ['biedt', 'woning'], werk_z: ['zoekt', 'werk'], werk_b: ['biedt', 'werk'], hulp_z: ['zoekt', 'dienst'], hulp_b: ['biedt', 'dienst'], koop: ['zoekt', 'spullen'], verkoop: ['biedt', 'spullen'], mensen: ['zoekt', 'mensen'], klant: ['biedt', 'dienst'], bijver: ['zoekt', 'werk', 'klus'], skill: ['biedt', 'dienst'], gratis: ['biedt', 'geven'], halen: ['zoekt', 'geven'], klus: ['zoekt', 'dienst', 'klus'], schoon: ['zoekt', 'dienst', 'schoonmaak'], lift: ['zoekt', 'rit'], vriend: ['zoekt', 'mensen'], nieuw: ['zoekt', 'mensen', 'nieuw'] };
const T = {
  en: { kantQ: 'Are you looking, or offering?', reach: 'How should I reach you when someone fits?', intro: 'A few taps so I can match you precisely.', sub: { woning: { zoekt: 'What kind of place?', biedt: 'What kind of place is it?' }, werk: { zoekt: 'What kind of work?', biedt: 'What kind of role?' }, dienst: { zoekt: 'Which service do you need?', biedt: 'Which service do you offer?' }, spullen: { zoekt: 'What do you want to buy?', biedt: 'What is it?' }, rit: { zoekt: 'What kind of ride?', biedt: 'What kind of rides?' }, mensen: { zoekt: 'What would you like to do together?' }, geven: { zoekt: 'What would you like?', biedt: 'What are you giving away?' } },
    area: 'Where?', prijs: { zoekt: 'Your budget?', biedt: 'Your price?' }, perMaand: ' (per month)', t: { woning: 'When?', dienst: 'When?', rit: 'When?', mensen: 'When suits you?' }, uren: 'What hours?',
    tk: { nu: 'Now', maand: 'Next month', later: 'Later', flex: 'Flexible', vandaag: 'Today', week: 'This week', vast: 'Regularly', doordeweeks: 'Weekdays', avond: 'Evenings', weekend: 'Weekends' }, uk: { vol: 'Full-time', deel: 'Part-time', klus: 'Gigs', flex: 'Flexible' },
    nearby: 'Anywhere nearby', online: 'Online is fine', skip: 'Skip', ander: 'Something else', gratis: 'Free', onder: n => 'Under ' + n, tot: (a, b) => a + ' to ' + b, boven: n => 'Over ' + n,
    jij: { zoekt: 'Looking for', biedt: 'Offering' }, jijG: { zoekt: 'Would like for free', biedt: 'Giving away' },
    geefRegel: n => 'WAM runs on giving, not on value: each time someone picks something up from you, you get +1; picking something up yourself is −1.' + (n !== null && n !== undefined ? ' Your balance: ' + (n > 0 ? '+' : '') + n + '.' : ''),
    prijsOk: 'price fits', gevonden: n => n === 1 ? 'Found 1 match for you:' : 'Found ' + n + ' matches for you:', waarom: 'Why it fits:', zelfde: 'same', nog: (w) => 'Saved: ' + w + '. Nobody fits yet, so you are first in line: I match you automatically the moment someone does.' },
  nl: { kantQ: 'Zoek je, of bied je?', reach: 'Hoe bereik ik je als iemand past?', intro: 'Een paar tikken, dan match ik je precies.', sub: { woning: { zoekt: 'Wat voor woonruimte?', biedt: 'Wat voor woonruimte is het?' }, werk: { zoekt: 'Wat voor werk?', biedt: 'Wat voor functie?' }, dienst: { zoekt: 'Welke dienst zoek je?', biedt: 'Welke dienst bied je?' }, spullen: { zoekt: 'Wat wil je kopen?', biedt: 'Wat is het?' }, rit: { zoekt: 'Wat voor rit?', biedt: 'Wat voor ritten?' }, mensen: { zoekt: 'Wat wil je samen doen?' }, geven: { zoekt: 'Wat zou je willen?', biedt: 'Wat geef je weg?' } },
    area: 'Waar?', prijs: { zoekt: 'Je budget?', biedt: 'Je prijs?' }, perMaand: ' (per maand)', t: { woning: 'Wanneer?', dienst: 'Wanneer?', rit: 'Wanneer?', mensen: 'Wanneer past het?' }, uren: 'Hoeveel uur?',
    tk: { nu: 'Nu', maand: 'Volgende maand', later: 'Later', flex: 'Maakt niet uit', vandaag: 'Vandaag', week: 'Deze week', vast: 'Vaak', doordeweeks: 'Doordeweeks', avond: '\'s Avonds', weekend: 'Weekend' }, uk: { vol: 'Fulltime', deel: 'Parttime', klus: 'Klussen', flex: 'Maakt niet uit' },
    nearby: 'Ergens in de buurt', online: 'Online kan ook', skip: 'Overslaan', ander: 'Iets anders', gratis: 'Gratis', onder: n => 'Onder ' + n, tot: (a, b) => a + ' tot ' + b, boven: n => 'Boven ' + n,
    jij: { zoekt: 'Zoekt', biedt: 'Biedt' }, jijG: { zoekt: 'Wil gratis', biedt: 'Geeft weg' },
    geefRegel: n => 'WAM draait op geven, niet op waarde: elke keer dat iemand iets bij jou ophaalt krijg je +1; zelf iets ophalen is −1.' + (n !== null && n !== undefined ? ' Jouw saldo: ' + (n > 0 ? '+' : '') + n + '.' : ''),
    prijsOk: 'prijs past', gevonden: n => n === 1 ? '1 match voor je gevonden:' : n + ' matches voor je gevonden:', waarom: 'Waarom het past:', zelfde: 'zelfde', nog: (w) => 'Bewaard: ' + w + '. Nog niemand past, dus jij staat vooraan: ik match je vanzelf zodra iemand past.' },
};
const tt = taal => T[taal === 'nl' ? 'nl' : 'en'];
const tl = taal => (taal === 'nl' ? 'nl' : 'en');
const MUNT = { CA: '$', US: '$', CO: '$', AU: '$', GB: '£', IN: '₹', NL: '€', DE: '€', BE: '€', FR: '€', ES: '€', IT: '€' };
const geld = (n, land) => { const L = String(land || '').toUpperCase(); if (L === 'IN') { const v = Number(n) * 80, p = Math.pow(10, Math.max(0, String(Math.round(v)).length - 2)); return '₹' + (Math.round(v / p) * p).toLocaleString('en-IN'); } return (MUNT[L] || '$') + Number(n).toLocaleString('en-US'); }; // 13 nov: Delhi kreeg 'Under ₹50' voor schoonmaak
// prijsklassen als labels: index 0..n
export function prijsLabels(cat, land, taal) {
  const c = TAX[cat]; if (!c || !c.prijs) return []; const t = tt(taal), g = n => geld(n, land), b = c.prijs, uit = [];
  let i0 = 0; if (b[0] === 0) { uit.push(t.gratis); i0 = 1; }
  uit.push(t.onder(g(b[i0]))); for (let i = i0; i < b.length - 1; i++) uit.push(t.tot(g(b[i]), g(b[i + 1]))); uit.push(t.boven(g(b[b.length - 1])));
  return uit;
}
// extra trefwoorden zonder uitrol (wam:flowkw), 60 s in het geheugen
let KW = { t: 0, h: {} };
const hmap = r => { const h = {}; if (Array.isArray(r)) for (let i = 0; i + 1 < r.length; i += 2) h[r[i]] = r[i + 1]; else Object.assign(h, r || {}); return h; };
// extra woorden (wam:flowkw) en hoe vaak elke soort gekozen werd (wam:flowsub), 60 s in het geheugen
export async function laadKw(kv) { if (Date.now() - KW.t < 60000) return; try { const [r, rs] = await Promise.all([kv.raw(['HGETALL', 'wam:flowkw']), kv.raw(['HGETALL', 'wam:flowsub']).catch(() => null)]); KW = { t: Date.now(), h: hmap(r), sub: hmap(rs) }; } catch (e) { KW.t = Date.now(); } }
const rx = w => new RegExp('\\b(' + w + ')', 'i');
const NIET_VRAGEN = new Set(['t', 'uren']);
// meest specifieke soort wint: per soort de som van de lengte van de geraakte woorden ("I fix laptops" is IT, niet klusjes)
function subVan(cat, tekst) { const c = TAX[cat]; if (!c) return ''; const t = String(tekst || ''); let best = '', bs = 0; for (const [k, [, kw]] of Object.entries(c.sub)) { const extra = KW.h[cat + '|' + k]; let sc = 0; for (const w of (kw + (extra ? '|' + extra : '')).split('|')) { if (w && rx(w).test(t)) sc += w.length; } if (sc > bs) { bs = sc; best = k; } } return best; }
export function catVanTekst(tekst) { const t = String(tekst || ''); for (const [cat, c] of Object.entries(TAX)) { const extra = KW.h[cat + '|*']; if (rx(c.kw + (extra ? '|' + extra : '')).test(t)) return cat; } for (const cat of Object.keys(TAX)) if (subVan(cat, t)) return cat; return ''; }
const BIED = /\b(i (have|offer|sell|am selling|'m selling|rent out|do|can|give|teach|fix|clean|make)|i'm (offering|hiring|selling|giving)|we're hiring|we are hiring|for sale|selling|sell|giving away|give away|renting out|ik (bied|heb|verkoop|verhuur|geef|kan)|te koop|te huur aangeboden|verkoop|verkopen)\b/i;
const ZOEK = /\b(need|looking for|look for|want|searching|search|seeking|buy|buying|zoek|nodig|wil|kopen)\b/i;
// begin van een flow uit een tikoptie of een getypte zin; null = de gewone regels
// knoppen uit 'Net in jouw buurt' ('I need: Home and kitchen'): soort en kant uit het label, niet opnieuw raden (13 nov: werd 'Retail or food: I have: Home and kitchen')
function labelKnop(tekst) {
  const pm = String(tekst || '').match(/^\s*(i need|i have|ik zoek|ik heb)\s*:\s*(.+?)\s*$/i); if (!pm) return null;
  const lab = pm[2].toLowerCase(); let hit = null;
  for (const [c, v] of Object.entries(TAX)) for (const [sb, a] of Object.entries(v.sub || {})) { const l = a[0] || {}; if ([l.en, l.nl].some(x => String(x || '').toLowerCase() === lab) && (!hit || c === 'geven')) hit = [c, sb]; }
  return hit ? { kant: /need|zoek/i.test(pm[1]) ? 'zoekt' : 'biedt', cat: hit[0], sub: hit[1] } : null;
}
export const schoonW = w => { const x = String(w || '').replace(/\b(i need|i have|i'm looking for|ik zoek|ik heb)\s*:\s*/gi, '').trim(); const m = x.match(/^([^:]{2,60}):\s*(.+)$/); return m && m[1].trim().toLowerCase() === m[2].trim().toLowerCase() ? m[1].trim() : x; };
export function flowBegin(s, tekst, startId) {
  let kant = '', cat = '', sub = '', pb; const lk = !startId ? labelKnop(tekst) : null;
  if (startId && START[startId]) { [kant, cat, sub, pb] = START[startId]; }
  else if (lk) { ({ kant, cat, sub } = lk); }
  else { cat = catVanTekst(tekst); if (!cat) return null; kant = BIED.test(tekst) ? 'biedt' : ZOEK.test(tekst) ? 'zoekt' : ''; if (!kant && String(tekst).trim().split(/\s+/).length > 5) return null; /* korte keuze zoals 'Work or gigs': eerst vragen of je zoekt of biedt */ if (cat === 'werk' && /\b(hiring|staff|personeel|employees?)\b/i.test(tekst)) kant = 'biedt'; sub = kant ? subVan(cat, tekst) : ''; }
  if (cat === 'geven' && !kant && !startId && /\b(free|gratis|anything|something)\b/i.test(tekst) && !/\b(give|giving|geef|geven|weg)\b/i.test(tekst)) { kant = 'zoekt'; sub = subVan(cat, tekst); }
  if (!TAX[cat]) return null;
  s.flow = { kant: TAX[cat].symmetrisch ? 'zoekt' : kant, cat, sub: sub || '', area: '', t: '', pb: pb === undefined ? '' : pb, extra: startId || lk || !kant ? '' : String(tekst || '').slice(0, 140), n: 0 };
  return s.flow;
}
// de volgende vraag met pills, of klaar
function vraag(s, ctx) {
  const f = s.flow, c = TAX[f.cat], t = tt(ctx.taal), opts = {};
  if (!f.kant) { const opts2 = {}, k2 = [c.kant.zoekt[tl(ctx.taal)], c.kant.biedt[tl(ctx.taal)]]; opts2[k2[0]] = 'zoekt'; opts2[k2[1]] = 'biedt'; f.vraag = 'kant'; f.opts = opts2; f.n += 1; return { veld: 'kant', x: (f.n === 1 ? t.intro + ' ' : '') + t.kantQ, k: k2 }; }
  // frictie weg (13 nov 02:40 UTC, eerste 35 flows): wanneer/uren werd maar 9 van 27 keer beantwoord (prijs 12 van 12), en waar met alleen de eigen stad als keuze 20 van 31.
  // Daarom: wanneer en uren niet meer vragen, en de stad meteen invullen als we die kennen (behalve als online kan); typen blijft altijd mogelijk.
  const onlineKan = (f.cat === 'dienst' && ['les', 'it'].includes(f.sub)) || (f.cat === 'werk' && f.sub === 'online');
  if (!f.area && ctx.stad && !onlineKan && f.sub) f.area = ctx.stad;
  const veld = c.vragen.find(v => (v === 'sub' && !f.sub) || (v === 'area' && !f.area) || (v === 'prijs' && f.pb === '') || (!NIET_VRAGEN.has(v) && (v === 't' || v === 'uren') && !f.t));
  if (!veld) return null;
  let x = '', k = [];
  // soorten lerend gesorteerd: vaakst gekozen (per kant) bovenaan, Something else altijd laatst
  if (veld === 'sub') { x = (t.sub[f.cat][f.kant] || t.sub[f.cat].zoekt); const tel = k0 => Number((KW.sub || {})[f.cat + '|' + f.kant + '|' + k0]) || 0; const ents = Object.entries(c.sub).map((e, i) => [e, i]).sort((a, b) => (tel(b[0][0]) - tel(a[0][0])) || (a[1] - b[1])).map(x => x[0]); for (const [key, [lab]] of ents) { const l = lab[tl(ctx.taal)]; opts[l] = key; k.push(l); } opts[t.ander] = 'anders'; k.push(t.ander); }
  if (veld === 'area') { x = t.area; const stad = ctx.stad || ''; if (stad) { opts[stad] = stad; k.push(stad); } opts[t.nearby] = 'nearby'; k.push(t.nearby); if ((f.cat === 'dienst' && ['les', 'it'].includes(f.sub)) || (f.cat === 'werk' && f.sub === 'online')) { opts[t.online] = 'online'; k.push(t.online); } }
  if (veld === 'prijs') { x = t.prijs[f.kant] + (c.perMaand ? t.perMaand : ''); prijsLabels(f.cat, ctx.land, ctx.taal).forEach((l, i) => { opts[l] = String(i); k.push(l); }); opts[t.skip] = 'skip'; k.push(t.skip); }
  if (veld === 't') { x = t.t[f.cat] || t.t.dienst; for (const key of c.t) { const l = t.tk[key]; opts[l] = key; k.push(l); } }
  if (veld === 'uren') { x = t.uren; for (const key of c.uren) { const l = t.uk[key]; opts[l] = key; k.push(l); } }
  f.vraag = veld; f.opts = opts; f.n += 1;
  return { veld, x: (f.n === 1 ? t.intro + ' ' : '') + x, k };
}
// verwerk een antwoord en geef de volgende stap: { x, k, veld } of { klaar: true }
export function flowStap(s, tekst, ctx) {
  const f = s.flow; if (!f) return null;
  if (f.vraag) {
    const v = f.vraag, ruw = String(tekst || '').trim(), key = f.opts && Object.prototype.hasOwnProperty.call(f.opts, ruw) ? f.opts[ruw] : null;
    if (v === 'kant') f.kant = key || (BIED.test(ruw) ? 'biedt' : 'zoekt');
    if (v === 'sub') { f.sub = key || subVan(f.cat, ruw) || 'anders'; if ((!key || key === 'anders') && ruw && !(f.opts && f.opts[ruw])) f.extra = ruw.slice(0, 140); }
    if (v === 'area') f.area = key || ruw.slice(0, 60) || ctx.stad || 'nearby';
    if (v === 'prijs') { if (key === 'skip') f.pb = 'x'; else if (key !== null) f.pb = Number(key); else { const m = ruw.match(/\d[\d,.]*/); f.pb = m ? bucket(Number(m[0].replace(/[,.](?=\d{3}\b)/g, '').replace(',', '.')) / (String(ctx && ctx.land || '').toUpperCase() === 'IN' ? 80 : 1), f.cat) : /free|gratis/i.test(ruw) ? 0 : 'x'; } }
    if (v === 't' || v === 'uren') f.t = key || 'flex';
    f.vraag = '';
  }
  const q = vraag(s, ctx); if (q) return q;
  return { klaar: true };
}
// het item in gewone woorden en voor de kaart
export function itemVan(f, ctx) {
  const c = TAX[f.cat], t = tt(ctx.taal), en = T.en, subLab = f.sub && c.sub[f.sub] ? c.sub[f.sub][0] : null;
  const wat = (subLab ? subLab.en : (f.extra || c.kant[f.kant].en)) + (f.extra && subLab && f.sub !== 'anders' ? ': ' + f.extra : '');
  const pl = f.pb !== '' && f.pb !== 'x' ? prijsLabels(f.cat, ctx.land, 'en')[f.pb] || '' : '';
  const tk = f.t ? (en.tk[f.t] || en.uk[f.t] || '') : '';
  return { kant: f.kant, soort: c.soort, wat: wat.slice(0, 140), eisen: pl, prijs: pl, waar: f.area === 'nearby' ? '' : f.area === 'online' ? 'online' : f.area, wanneer: tk, cat: f.cat, sub: f.sub, pb: f.pb === 'x' ? '' : f.pb, tk: f.t || '', zinNl: subLab ? subLab[tl(ctx.taal)] : wat };
}
export function kaartRegel(it, ctx) {
  const t = tt(ctx.taal), c = TAX[it.cat]; const sub = it.sub && c && c.sub[it.sub] ? c.sub[it.sub][0][tl(ctx.taal)] : it.wat;
  const tk = it.tk ? (t.tk[it.tk] || t.uk[it.tk] || '') : '', pl = it.pb !== '' && it.pb !== undefined && c && c.prijs ? prijsLabels(it.cat, ctx.land, ctx.taal)[it.pb] || '' : '';
  return [(c && c.geven && t.jijG ? t.jijG : t.jij)[it.kant === 'biedt' ? 'biedt' : 'zoekt'], sub, it.waar || (ctx.stad || ''), tk, pl].filter(Boolean).join(' · ');
}
// categorie en soort van een item, ook van oude items zonder velden (uit soort en woorden)
const SOORTCAT = { woning: 'woning', baan: 'werk', dienst: 'dienst', iets: 'spullen', iemand: 'mensen' };
export function catVan(z) {
  if (z.cat && TAX[z.cat]) return { cat: z.cat, sub: z.sub || '' };
  const tekst = String(z.wat || '') + ' ' + String(z.eisen || '');
  let cat = catVanTekst(tekst); if (!cat) cat = SOORTCAT[z.soort] || ''; if (cat === 'dienst' && /\b(ride|lift|carpool|airport)\b/i.test(tekst)) cat = 'rit';
  return { cat, sub: cat ? subVan(cat, tekst) : '' };
}
// prijsklasse-index, gelijk aan de volgorde van prijsLabels: [gratis,] onder b1, b1-b2, ..., boven bn
function bucket(n, cat) { const b = (TAX[cat] || {}).prijs; if (!b || !Number.isFinite(n)) return 'x'; if (b[0] === 0 && n === 0) return 0; const arr = b[0] === 0 ? b.slice(1) : b, off = b[0] === 0 ? 1 : 0; return off + arr.filter(x => n >= x).length; }
function prijsIdx(z, cat) { if (z.pb !== undefined && z.pb !== '' && z.pb !== 'x') return Number(z.pb); const b = (TAX[cat] || {}).prijs; if (!b) return null; const m = String(z.eisen || z.prijs || '').toLowerCase(); if (/\b(free|gratis)\b/.test(m) && b[0] === 0) return 0; const g = m.match(/\d[\d,]*/); if (!g) return null; const n = Number(g[0].replace(/,/g, '')); if (!n) return null; return bucket(n, cat); }
const norm = x => String(x || '').toLowerCase().trim();
// matchen: zelfde categorie en soort (of 'anders' met een gedeeld woord), andere kant (mensen: iedereen), zelfde stad of 'in de buurt', passende tijd en prijs
export function flowMatch(eigen, lijst, ctx, eigenVid) {
  const ec = { cat: eigen.cat, sub: eigen.sub }, c = TAX[ec.cat]; if (!c) return [];
  const stad = norm(eigen.waar || ctx.stad), ep = prijsIdx(eigen, ec.cat), uit = [];
  for (const z of lijst) {
    if (String(z.k || '').split(':')[0] === eigenVid) continue;
    if (String(z.land || '').toUpperCase() !== String(ctx.land || '').toUpperCase()) continue;
    const zk = z.kant === 'biedt' ? 'biedt' : 'zoekt'; if (!c.symmetrisch && zk === eigen.kant) continue;
    const zc = catVan(z); if (zc.cat !== ec.cat) continue;
    let subOk = false; if (ec.sub && ec.sub !== 'anders' && zc.sub === ec.sub) subOk = true;
    if (!subOk && (!ec.sub || ec.sub === 'anders' || !zc.sub)) { const w1 = new Set(norm(eigen.wat + ' ' + (eigen.extra || '')).split(/[^a-z]+/).filter(w => w.length > 3)); subOk = norm(z.wat).split(/[^a-z]+/).some(w => w.length > 3 && w1.has(w)); }
    if (!subOk) continue;
    const zs = norm(z.stad || z.waar), redenen = [ec.sub && c.sub[ec.sub] ? c.sub[ec.sub][0][tl(ctx.taal)] : ''];
    let score = 3;
    if (stad && zs && (zs.includes(stad) || stad.includes(zs))) { score += 2; redenen.push(z.stad || z.waar); } else if (eigen.waar === 'online' || /online|remote/i.test(z.waar || '')) { score += 1; redenen.push('online'); } else if (stad && zs) continue; // andere stad: geen match
    const zt = z.tk || ''; if (eigen.tk && zt && (eigen.tk === zt || eigen.tk === 'flex' || zt === 'flex')) { score += 1; redenen.push((T[tl(ctx.taal)].tk[eigen.tk] || T[tl(ctx.taal)].uk[eigen.tk] || '').toLowerCase()); }
    const zp = prijsIdx(z, ec.cat); if (ep !== null && zp !== null) { const koper = eigen.kant === 'zoekt' ? ep : zp, verkoper = eigen.kant === 'zoekt' ? zp : ep; if (verkoper > koper + 0) { if (verkoper > koper + 1) continue; } else { score += 1; redenen.push(T[tl(ctx.taal)].prijsOk); } }
    uit.push({ z, score, redenen: redenen.filter(Boolean) });
  }
  return uit.sort((a, b) => b.score - a.score || Number(b.z.tb || 0) - Number(a.z.tb || 0)).slice(0, 5);
}
export function matchTekst(ms, ctx) {
  const t = tt(ctx.taal); if (!ms.length) return '';
  const kort = (x, n) => { x = String(x || '').replace(/\s+/g, ' ').trim(); if (x.length <= n) return x; const c = x.slice(0, n); const i = c.lastIndexOf(' '); return (i > n * 0.6 ? c.slice(0, i) : c).replace(/[,;:.\s-]+$/, '') + '…'; };
  // dezelfde regel van meerdere mensen één keer tonen, met het aantal erbij (3 matches = 3 mensen, ook als hun tekst gelijk is)
  const tel = new Map();
  const watL = z => { const c = TAX[z.cat], x = c && z.sub && c.sub[z.sub] ? c.sub[z.sub][0] : null, w = schoonW(z.wat); return x && w.startsWith(x.en) ? (x[tl(ctx.taal)] || x.en) + w.slice(x.en.length) : w; }; // soortlabel in de taal van de lezer
  for (const m of ms) { const r = [kort(watL(m.z), 48), m.z.stad || m.z.waar || '', kort(m.z.wanneer, 24), kort(m.z.eisen, 30)].filter(Boolean).join(' · '); const sl = r.toLowerCase(); if (tel.has(sl)) tel.get(sl).n++; else if (tel.size < 3) tel.set(sl, { r, n: 1 }); }
  const regels = [...tel.values()].map(x => '• ' + x.r + (x.n > 1 ? ' (' + x.n + '×)' : ''));
  return t.gevonden(ms.length) + '\n' + regels.join('\n') + '\n' + t.waarom + ' ✓ ' + ms[0].redenen.join(' ✓ ');
}
export const flowT = tt;
