// Clickmind-proeven: een pagina die zelf leert welke versie van elk onderdeel het meest oplevert.
// Henkjan 10 nov 2026, na de doorlichting van de afrekenpagina van Kadoly: "Ja en maak alles daarvan lerend ."
//
// Hoe het werkt
// - Per site een proef met onderdelen (factoren), elk met versies: 'a' is wat er nu staat, 'b' (en verder) de nieuwe.
// - cm.js vraagt bij het eerste paginabezoek één beslissing voor alle onderdelen (GET /api/mm/proefkies) en bewaart die 7 dagen in de
//   browser (cmpf:<site>), zodat iemand op de productpagina en de afrekenpagina dezelfde versies ziet.
// - De site zet elke versie in de pagina met data-cm-v="<onderdeel>:<versie>" (de nieuwe met het attribuut hidden); cm.js laat
//   per onderdeel alleen de gekozen versie zien. Gedrag in eigen code: window.cmProef('<onderdeel>') geeft de versie.
// - Telt pas als iemand het onderdeel echt zag (gebeurtenis 'zie', alleen voor onderdelen die op de pagina staan).
// - Waarde per bezoeker = de verste stap op weg naar betalen: 20 s op de afrekenpagina 1, veld aangetikt 3, betaalmethode 5,
//   op Betalen 20, betaald 100 (zelfde ladder voor elk onderdeel). Elk onderdeel leert los (factorieel): iedereen krijgt van elk
//   onderdeel een versie, dus elk onderdeel gebruikt alle bezoekers.
// - Kiezen: Thompson sampling op de gemiddelde waarde per versie, per apparaat (iPhone, Android, computer) met de andere
//   apparaten als terugval; altijd 10% willekeurig zodat het blijft leren. Wint een versie, dan krijgt die vanzelf bijna iedereen.
// - Opslag is krap: tellers in één hash per site en ronde (mm:pf:<site>:<ronde>), per bezoeker één veld in een daghash
//   (mm:pfm:<site>:<dag>, 9 dagen). Geen persoonsgegevens, geen inhoud van velden.
// Lezen: /api/mm/proefstand?site=kadoly[&vorm=tekst]. Aan/uit, onderdelen, nieuwe ronde: /api/mm/proefzet (beschermde host).
import { modalAlias } from './modal.js';

const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
export const WAARDE = { b20: 1, veld: 3, methode: 5, betaal: 20, koop: 100 };
export const STAPPEN = Object.keys(WAARDE);
const CTX = ['i', 'a', 'd']; // iPhone/iPad, Android, computer
const CTX_NAAM = { i: 'iPhone', a: 'Android', d: 'computer' };
const DAGEN = 9;
// willekeurig deel: 30% zolang een versie minder dan 200 keer gezien is (één vroege koop van 100 punten mag niet alles beslissen), daarna 10%
const verken = sch => (Math.min(...sch.map(x => x.n)) < 200 ? 0.3 : 0.1);

export const PROEVEN = {
  // WAM: een knopklik is geen aanmelding; hoogste waarde pas na opslag door de WAM-server.
  wmn: { aan: true, ronde: 1, sinds: '2026-11-24', host: 'wearemany.now', waarde: { tik: 1, aanmelding: 100 }, factoren: [{ id: 'volgknop', gelijkTot: 300, pagina: 'dossier', wat: 'Tekst op de vaste aanmeldknop', varianten: [{ id: 'a', naam: 'Houd me op de hoogte' }, { id: 'b', naam: 'Ik blijf betrokken' }] }] },
  kadoly: {
    aan: true, ronde: 1, sinds: '2026-11-10',
    factoren: [
      { id: 'levering', pagina: 'kassa', wat: 'Levertijd bovenaan de afrekenpagina', varianten: [{ id: 'a', naam: '"Thuisbezorgd in 5–7 werkdagen · verwacht …" (nu)' }, { id: 'b', naam: 'Alleen de datum: "In huis di 17 – do 19 nov", dezelfde tekst als op de productpagina' }] },
      { id: 'snel', pagina: 'kassa', wat: 'Snelle knoppen', varianten: [{ id: 'a', naam: 'Alleen het PayPal-blok bovenaan (nu)' }, { id: 'b', naam: 'Bovenaan drie knoppen: Apple Pay (iPhone) of Google Pay (Android), PayPal, iDEAL' }] },
      { id: 'kop', pagina: 'kassa', wat: 'Bestelling bovenaan', varianten: [{ id: 'a', naam: 'Kaart met kleine foto (nu)' }, { id: 'b', naam: 'Grote foto met "€prijs · verzending gratis · gratis retour 14 dagen"' }] },
      { id: 'adres', pagina: 'kassa', wat: 'Adres invullen', varianten: [{ id: 'a', naam: 'Adresformulier met landenlijst (nu)' }, { id: 'b', naam: 'E-mail eerst, dan postcode + huisnummer die straat en plaats invullen; Nederland vast, ander land via een link' }] },
      { id: 'vinkje', uit: true, waarom: 'vervallen 10 nov: het vinkje is de wettelijke afstandsverklaring voor downloads en blijft staan', pagina: 'kassa', wat: 'Voorwaarden', varianten: [{ id: 'a', naam: 'Verplicht vinkje (nu)' }, { id: 'b', naam: 'Geen vinkje, de zin "Door te betalen ga je akkoord met de voorwaarden"' }] },
      { id: 'koopbalk', pagina: 'product', wat: 'Nu kopen-balk op de productpagina', varianten: [{ id: 'a', naam: 'Balk direct in beeld (nu)' }, { id: 'b', naam: 'Balk pas zodra de prijs en de koopknop uit beeld zijn gescrold' }] },
    ],
  },
  // Bedrijfspagina's van curacao.day (hjdk-api lib/cur.js renderGidsBedrijf, lib/curux.js). Henkjan 14 nov 2026: "Deze paginas moeten echt veel
  // veel strakker" en "Maak de pagina helemaal lerend op interactiviteit ." Waarde per bezoeker = de sterkste tik: iets aangetikt 1, ander bedrijf 2,
  // sterren 3, vraag gesteld 4, website 5, route 8, bellen 10, WhatsApp 10, eigenaar claimt 12. Nieuwe uitdagers: data/cur/ux-uitdagers.json (nachtronde).
  curbedrijf: {
    aan: true, ronde: 5, sinds: '2026-11-23', // ronde 5: mensmeting na interactie of 3s zichtbaar; oude bots apart. Ronde 4: FAQ-vragen per soort zaak in de chat, context van de pagina (Henkjan 14 nov 2026: "een beetje faq achtig"); ronde 3: feiten, sterren en slimme vragen in de chat ("Dit moet echt via onze chat"); ronde 2: schoner, de chat van de site met voorbeeldvragen over de zaak (Henkjan 14 nov 2026: "Veel te druk moet veel cleaner")
    waarde: { tik: 1, ander: 2, ster: 3, vraag: 4, site: 5, route: 8, bel: 10, wa: 10, claim: 12 },
    factoren: [
      { id: 'knop', pagina: 'bedrijf', wat: 'Gevulde hoofdknop', varianten: [{ id: 'a', naam: 'Bellen gevuld voorop' }, { id: 'b', naam: 'Route gevuld voorop' }] },
      { id: 'buurt', pagina: 'bedrijf', wat: 'Lijst andere zaken', varianten: [{ id: 'a', naam: 'Dichtbij, met afstand' }, { id: 'b', naam: 'Best beoordeeld in de soort' }] },
      { id: 'vragen', pagina: 'bedrijf', wat: 'FAQ-vragen in de chat', varianten: [{ id: 'a', naam: 'Drie FAQ-vragen bij deze soort zaak' }, { id: 'b', naam: 'Twee FAQ-vragen' }] },
    ],
  },
  // Nieuwe bovenkant van elke keuzehulp (lib/kzux.js), per markt een eigen proef. Henkjan 15 nov 2026: "Maak UX lerend. Ik ga dan verkeer
  // organiseren zodat je kunt leren". Waarde per bezoeker = de sterkste stap: iets aangetikt 1, situatie-pill 2, vraag gesteld 4, klik naar de winkel 10.
  ...Object.fromEntries([['kzuxnl', 'keuzehulp.best'], ['kzuxus', 'whichtobuy.best'], ['kzuxde', 'kaufberater.best']].map(([id, host]) => [id, {
    aan: true, ronde: 3, sinds: '2026-11-19', host, // ronde 3 (19 nov): factor pillflow (a = chat van nu, b = vaste stappen met pills); top, opener en blijf uit (minder losse variabelen); ronde 2 (17 nov): chat met pills op elke keuzehulp
    // intentie (19 nov 2026, Henkjan: "Chat moet vooral uit pills bestaan om ze te activeren, zo weinig mogelijk typen"): intentie met 2 of meer velden telt 30, zodat intenties per 100 bezoekers de rechter zijn; gekoppeld = tik op Koppel aan je assistent
    waarde: { tik: 1, pill: 2, vraag: 4, quiz: 6, winkel: 10, blijf: 12, onthoud: 15, deel: 25, intentie: 30, datum: 30, gekoppeld: 40, contact: 45 }, // quiz en deel: haken (lib/haak.js, 21 nov 2026) // onthoud, datum, contact: één chat die onthoudt (lib/geheugen.js, 20 nov 2026) // blijf (18 nov 2026, Henkjan: "Chat moet leren . Ze binnen halen te blijven voor iets met email of anderen optie"): volgt of laat een e-mailadres achter
    factoren: [...(id === 'kzuxnl' ? [{ id: 'haak', pagina: 'keuzehulp', wat: 'Haak in de chat (lib/haak.js, 21 nov 2026, Henkjan: "vind je hooks probeer alles uit"); alleen op pagina\'s met inhoud in HAAK', varianten: [{ id: 'a', naam: 'Geen haak' }, { id: 'b', naam: 'Peiling boven de chat, daarna wat anderen kozen' }, { id: 'c', naam: 'Kennistest boven de chat, score, contact met dezelfde score' }, { id: 'd', naam: 'Peiling na het eerste chatantwoord' }, { id: 'e', naam: 'Uitdaging: wie weet meer, jij of je vriend' }] }] : []), { id: 'onthoud', pagina: 'keuzehulp', wat: 'Wanneer de chat vraagt of hij de wens mag onthouden (lib/geheugen.js)', varianten: [{ id: 'a', naam: 'Na het eerste nuttige antwoord' }, { id: 'b', naam: 'Na het tweede nuttige antwoord' }] }, { id: 'meer', pagina: 'keuzehulp', wat: 'Na het tweede antwoord: Waar kan ik je nog meer mee helpen?', varianten: [{ id: 'a', naam: 'Wel vragen, met 4 pills' }, { id: 'b', naam: 'Niet vragen' }] }, { id: 'start', pagina: 'keuzehulp', wat: 'Start van de chat (20 nov 2026, Henkjan: geen pills vooraf of pills die de chat starten; doel engagen, intentie en contact)', varianten: [{ id: 'a', naam: 'Eigen vragen van de pagina als pills' }, { id: 'b', naam: 'Geen pills vooraf: open vraag van de chat in het invoerveld', uit: true /* 20 nov 2026, Henkjan: "Zorg dat overal dezelfde chat staat ! Met erbij de context pills om in te stappen" */ }, { id: 'c', naam: 'Drie pills die een gesprek starten: Help me kiezen, Ik twijfel tussen twee, Wat past bij mij?' }] }, { id: 'pillflow', pagina: 'keuzehulp', wat: 'Verloop van de chat (docs/chat-pills-ontwerp.md)', varianten: [{ id: 'a', naam: 'Chat van nu: pill of vraag, dan een vervolgvraag van de AI' }, { id: 'b', naam: 'Vaste stappen met pills: wat, voor wie of situatie, budget; voortgang, Iets anders, advies na hooguit 3 tikken, dan blijven of koppelen', uit: id !== 'kzuxnl' /* 23 nov 2026: US en DE winnaar a, beide armen >=300 gezien en kans beste 100%; NL wacht op meer data */ }] }, { id: 'opener', uit: true, pagina: 'keuzehulp', wat: 'Eerste zin van de chat (WAM: de opener bepaalt of koud verkeer gaat praten)', varianten: [{ id: 'a', naam: 'Kop van de pagina (Vraag het de keuzehulp of eigen kop)' }, { id: 'b', naam: 'Waar twijfel je over bij {term}?' }, { id: 'c', naam: 'Vertel wat je zoekt, dan help ik je kiezen' }] }, { id: 'blijf', uit: true, pagina: 'keuzehulp', wat: 'Aanbod om te blijven in de chat', varianten: [{ id: 'a', naam: 'Na het tweede antwoord: elke ochtend laten weten? ja of nee' }, { id: 'b', naam: 'Na het eerste antwoord: bewaren en seintje, kies per e-mail of als melding' }] }, { id: 'top', uit: true, pagina: 'keuzehulp', wat: 'Bovenkant van de keuzehulp', varianten: [{ id: 'a', naam: 'Chat met pills bovenaan, zonder de 3 beste' }, { id: 'b', naam: 'Kort antwoord, de 3 beste met prijs en winkelknop, situaties als pills, vraagbalk' }] }],
  }])),
  // Live tafel met de AI als gastvrouw (lib/tafel.js, 20 nov 2026, Henkjan: "Ja bouw en dan gaan we A / B testen daar"): a = alleen de chat, b = chat plus
  // de pill naar de live tafel. Op elke keuzehulp, ook gezondheid (lib/tafel.js tafelAan); 50/50 tot elke versie 300 keer gezien is (Henkjan: "veel data"). Rechter: intentie en contact per 100 bezoekers, zoals bij de chat
  // (chatgebeurtenissen tellen in beide armen mee); open, plus en zeg laten zien of mensen met elkaar praten.
  ...Object.fromEntries([['tafelnl', 'keuzehulp.best'], ['tafelus', 'whichtobuy.best'], ['tafelde', 'kaufberater.best']].map(([id, host]) => [id, {
    // ronde 2 (20 nov 2026, Henkjan: "Bedenk varianten zodat het overal werkt ? En de asynchrone oplossing ?"): ronde 1 gaf tegengestelde uitkomsten,
    // DE a 4,06 tegen b 2,11 (90%), US b 3,70 tegen a 2,08 (89%), 47-79 gezien per versie; in DE trok de tafelknop aandacht van de chatpills (pill 9 tegen 16).
    // Nu vier vormen van dezelfde asynchrone tafel, zodat we zien welke in elke markt werkt.
    aan: true, ronde: 2, sinds: '2026-11-20', host,
    waarde: { tik: 1, pill: 2, open: 3, vraag: 4, plus: 5, zeg: 10, terug: 20, intentie: 30, contact: 45 },
    factoren: [{ id: 'tafel', gelijkTot: 300, pagina: 'keuzehulp', wat: 'Asynchrone tafel: vragen achterlaten voor mensen die het al hebben', varianten: [{ id: 'a', naam: 'Alleen de chat' }, { id: 'b', naam: 'Knop Laat een vraag achter boven de chat, tafel in een paneel' }, { id: 'c', naam: 'Geen knop vooraf: na het eerste chatantwoord het aanbod je vraag aan eigenaars te stellen, antwoord per mail' }, { id: 'd', naam: 'Onder de chat: Dit vroegen anderen hier, met antwoord; eigenaars kunnen antwoorden' }] }],
  }])),
  // Algemene chat-LP /chat (lib/cadeauvinder.js lpPagina, 20 nov 2026, Henkjan: "algemene chat waar put uit alle keuzehulpen op een zeer strakke LP
  // waar alleen veld en paar pills ? Dan kunnen we ook extreem optimaliseren"). Per persoon vast (cookie kzlp, 8 dagen), gekozen op de server.
  // Eén factor per ronde (rust). Rechter: tweede vraag (gesprek) en intentie per 100 bezoekers.
  ...Object.fromEntries([['kzlpnl', 'keuzehulp.best'], ['kzlpus', 'whichtobuy.best'], ['kzlpde', 'kaufberater.best']].map(([id, host]) => [id, {
    aan: true, ronde: 1, sinds: '2026-11-20', host,
    waarde: { tik: 1, pill: 2, vraag: 4, gesprek: 8, winkel: 10, blijf: 12, intentie: 30 },
    factoren: [{ id: 'start', gelijkTot: 300, pagina: 'lp', wat: 'Pills om in te stappen', varianten: [{ id: 'a', naam: 'Vier onderwerpen (Een cadeau vinden, ...)' }, { id: 'b', naam: 'Vier concrete vragen (Welke thuisbatterij past bij mij?, ...)' }] }],
  }])),
  // Voorkant van de keuzehulpen (keuzehulp.best/, whichtobuy.best/, kaufberater.best/; lib/cadeauvinder.js voorkantPagina, lib/vk-sjablonen.js).
  // Henkjan 19 nov 2026: "We gaan ze allemaal testen waar chat best converteert naar betrokken chatter die terugkomt ." Vier ontwerpen van vier
  // UX-experts, per persoon vast (cookie kzvk, 8 dagen), gekozen op de server. Waarde = de verste stap: iets aangetikt 1, vraag gesteld 3,
  // tweede vraag in hetzelfde bezoek 6, blijft (volgt of laat mail achter) 10, komt op een latere dag terug en tikt of vraagt weer 20.
  kzvk: {
    aan: true, ronde: 1, sinds: '2026-11-19', host: 'keuzehulp.best',
    waarde: { tik: 1, vraag: 3, gesprek: 6, blijf: 10, terug: 20 },
    factoren: [{ id: 'vorm', pagina: 'voorkant', wat: 'Ontwerp van de voorkant', varianten: [{ id: 'a', naam: 'Minimalist: alleen invoer, geen pills, 5 populaire' }, { id: 'b', naam: 'Conversie: voorbeeld in het veld, 3 pills plus Ik mis een keuzehulp, mis-regel onder de lijst' }, { id: 'c', naam: 'Mobiel en toegankelijk: grote tikdoelen, 3 pills, wie erachter zit in de voet' }, { id: 'd', naam: 'Rust en typografie: trouw aan sealedintent' }] }],
  },
  // Rotterdam-dienstpagina's (keuzehulp.best/rotterdam/<dienst>, lib/rdam.js LIJST_JS). Henkjan 19 nov 2026: "Ik vind de lijst met bijv allemaal
  // tandartsen daaronder niet heel slim of leuk hoe doen we dat beter ? Alleen via keuzehulp of chat laten zien ? Misschien met AB test testen ?"
  // Waarde per bezoeker = de sterkste stap: iets aangetikt 1, zaakpagina 2, vraag in de chat 4, website 5, route 8, bellen 10.
  rdamlijst: {
    aan: true, ronde: 1, sinds: '2026-11-19', host: 'keuzehulp.best',
    waarde: { tik: 1, zaak: 2, vraag: 4, web: 5, route: 8, bel: 10 },
    factoren: [{ id: 'lijst', pagina: 'dienst', wat: 'Zaken onder de chat', varianten: [{ id: 'a', naam: 'De hele lijst met filters (nu)' }, { id: 'b', naam: 'Drie zaken met pills (best beoordeeld, nu open, dichtbij mij, neemt patiënten aan), de hele lijst achter Toon alle' }] }],
  },
  // Doorsturen bij elk item op alle keuzehulpen (lib/deel.js). Henkjan 19 nov 2026: "Maak ook de plek WAAR deze CTA staat lerend . De CTA zelf ."
  // Waarde per bezoeker: tik 1, gedeeld (deelmenu) of link gekopieerd 10, iemand kwam binnen via de gedeelde link 25.
  deel: {
    aan: true, ronde: 1, sinds: '2026-11-19',
    waarde: { tik: 1, deel: 10, binnen: 25 },
    factoren: [
      { id: 'plek', pagina: 'alle', wat: 'Waar de doorstuurknop staat', varianten: [{ id: 'a', naam: 'Onder de knoppen van het item' }, { id: 'b', naam: 'Klein icoon rechtsboven in het item' }, { id: 'c', naam: 'Als tekstlink onder de naam' }] },
      { id: 'tekst', pagina: 'alle', wat: 'Tekst op de knop', varianten: [{ id: 'a', naam: 'Stuur door / Send to someone / Weiterleiten' }, { id: 'b', naam: 'Deel met iemand / Share / Teilen' }, { id: 'c', naam: 'Stuur naar wie dit zoekt / Send to a friend who needs this / An jemanden schicken, der das sucht' }] },
    ],
  },
  // Wat je daarna toont (lib/volgende.js): de lijst met volgende gidsen onderaan elke keuzehulp. Henkjan 19 nov 2026: "Maak ook lerend . Wat je
  // daarna toont based op die persoon . die daar al zit ." Waarde per bezoeker: gids aangetikt 5, op de volgende pagina verder gegaan 10.
  volg: {
    aan: true, ronde: 1, sinds: '2026-11-19',
    waarde: { klik: 5, verder: 10 },
    factoren: [{ id: 'volgorde', pagina: 'alle', wat: 'Volgorde van de volgende gidsen', varianten: [{ id: 'a', naam: 'Vaste volgorde van de server (controle)' }, { id: 'b', naam: 'Eigen interesse van de bezoeker 60% en wat bij iedereen werkt 40%, al gelezen onderaan' }, { id: 'c', naam: 'Alleen wat bij iedereen werkt, al gelezen onderaan' }] }],
  },
  // Chatbewijs (lib/chatbewijs.js): een regel onder de kop van de chat met echte cijfers. Henkjan 19 nov 2026: "Laat het geleerde ook bij de chats
  // meteen zien aantal vragen en antwoorden . Aantal mensen nu in gessprek . Maak dit lerend of dat beter converteert of niet ."
  chatbewijs: {
    aan: true, ronde: 1, sinds: '2026-11-19',
    waarde: { pill: 2, vraag: 5, winkel: 10 },
    factoren: [{ id: 'bewijs', pagina: 'alle', wat: 'Cijfers bij de chat', varianten: [{ id: 'a', naam: 'Geen cijfers (controle)' }, { id: 'b', naam: 'Vragen beantwoord deze week, over deze pagina en mensen nu in gesprek' }] }],
  },
  // Sealed Intent (sealedintent.com, lib/sealed.js). Henkjan 15 nov 2026: "ALLES moet lerend zijn" en "zoek een meer corporate look ... of is
  // deze cleane UX wel goed?": de stijl is zelf een onderdeel. Waarde per bezoeker = de verste stap: iets aangetikt 1, hulpmiddel gestart 2,
  // uitkomst gezien 4, voorwaarden geopend 6, geldig e-mailadres 10, verzegeld 20.
  sealed: {
    aan: true, ronde: 1, sinds: '2026-11-16', host: 'sealedintent.com',
    waarde: { tik: 1, start: 2, uitkomst: 4, voorwaarden: 6, mail: 10, verzegeld: 20, aanvraag: 20 }, // aanvraag = een partij vraagt toegang (partijpagina)
    factoren: [
      { id: 'stijl', pagina: 'landing', wat: 'Uitstraling', varianten: [{ id: 'a', naam: 'Clean: Inter, wit, blauw #2B47C4 (outname.now)' }, { id: 'b', naam: 'Corporate: koppen in serif (Source Serif 4), donker marineblauw als accent' }] },
      { id: 'cta', pagina: 'landing', wat: 'Tekst op de startknop', varianten: [{ id: 'a', naam: 'Wat je krijgt ("Bereken de waarde")' }, { id: 'b', naam: 'Anoniem voorop ("Bereken anoniem, zonder naam")' }] },
      { id: 'volgorde', pagina: 'landing', wat: 'Volgorde', varianten: [{ id: 'a', naam: 'Eerst het antwoord met cijfers, dan het hulpmiddel' }, { id: 'b', naam: 'Hulpmiddel direct onder de titel, antwoord daarna' }] },
    ],
  },
  // Kadoly Spaarpot (lib/dagkans.js). Henkjan 20 nov 2026: "Maak het volkomen lerend . ALLE variabelen ... ze moeten doorsturen via email of whats app
  // ook al die moeten lerend zijn cta s etc". Beslissing op de server per deelnemer (cookie dkpf, daarna op zijn record), gebeurtenissen vanuit de server.
  // Waarde = de verste stap: aanvraag 2, deel 4, terug (klikt op een latere dag) 6, product 8, bevestigd 10, vriend (iemand bevestigt via zijn link) 30, koop 100.
  // Bedragen (startpot, per klik) leren hier bewust niet mee: de waarde telt de kosten nog niet, dus de proef zou altijd het duurste kiezen.
  ...Object.fromEntries(['spaarpot', 'spaarpottest'].map(id => [id, {
    aan: true, ronde: 1, sinds: '2026-11-20', host: 'gids.kadoly.com',
    waarde: { aanvraag: 2, deel: 4, terug: 6, product: 8, bevestigd: 10, vriend: 30, koop: 100 },
    factoren: [
      { id: 'kop', pagina: 'aanmelden', wat: 'Kop van de aanmeldpagina', varianten: [{ id: 'a', naam: 'Start met een gevulde spaarpot' }, { id: 'b', naam: 'Spaar samen voor een gratis cadeau' }] },
      { id: 'knop', pagina: 'aanmelden', wat: 'Knop van de aanmeldpagina', varianten: [{ id: 'a', naam: 'Start mijn Spaarpot' }, { id: 'b', naam: 'Pak mijn gevulde pot' }] },
      { id: 'onderwerp', pagina: 'mail', wat: 'Onderwerp van de ochtendmail (met vrienden)', varianten: [{ id: 'a', naam: 'Samen gespaard: €X · klik voor je vrienden' }, { id: 'b', naam: 'N vrienden klikten voor je · klik terug' }] },
      { id: 'mknop', pagina: 'mail', wat: 'Twee knoppen bij het product in de ochtendmail (elke keuze telt als klik)', varianten: [{ id: 'a', naam: 'Meer van dit / Minder van dit' }, { id: 'b', naam: 'Ja, leuk / Niet mijn ding' }] },
      { id: 'deel', pagina: 'pot', wat: 'Delen', varianten: [{ id: 'a', naam: 'Alleen WhatsApp' }, { id: 'b', naam: 'WhatsApp en per mail' }] },
      { id: 'deeltekst', pagina: 'pot', wat: 'Tekst van het deelbericht', varianten: [{ id: 'a', naam: 'Via mijn link start je met €5; klik jij, dan krijg ik er wat bij, en andersom' }, { id: 'b', naam: 'Uitdaging: wie klikt er elke dag voor mij? Ik klik terug; via mijn link start je met €5' }] },
      { id: 'product', pagina: 'pot', wat: 'Plek van het cadeau-idee van vandaag', varianten: [{ id: 'a', naam: 'Na Samen gespaard' }, { id: 'b', naam: 'Bovenaan, voor Samen gespaard' }] },
    ],
  }])),
  // Groepscadeaus op gids.kadoly.com (lib/groepscadeau.js). Henkjan 21 nov 2026: "maak groepsverhaal lerend". Beslissing per bezoeker (cookie gcpf),
  // de groep erft de versie van de organisator: wie via zijn link meedoet, telt mee voor zijn versie. Waarde = de verste stap.
  // Lerende LP van Nexy (repo clickmind-distribution lib/lp.js, nexy.now; getnexy.app stuurt mee). Henkjan 24 nov 2026: "LP maken die we auto iteratief laten leren
  // op basis van Clickmind. CTA's zijn appstores en web. Als iemand op telefoon dan direct naar goede appstore sturen." Daarna voor ieder merk (docs/lp-draaiboek.md).
  // Waarde per bezoeker = de verste stap: iets aangetikt 1, gelezen (50% gescrold of 20 s) 2, naar de groep gestuurd 6, web 8, store 10, QR gescand 10.
  // store, web en qr meldt /s/<merk> op de server; tik, lees en deel de pagina zelf.
  nexylp: {
    aan: true, ronde: 4, sinds: '2026-11-25', host: 'nexy.now', // ronde 4 (25 nov): onderdeel 'sub' erbij, Henkjans zin uit de bio tegen de huidige ondertitel ("Test dit op website en in de posts van morgen"). Ronde 3 (24 nov 13:45 UTC): schone start zonder Henkjans eigen bezoek (nexy.now/?eigen=1 zet eigen toestellen uit de meting). Ronde 2: schone start na de testklik van 24 nov
    waarde: { tik: 1, lees: 2, deel: 6, web: 8, store: 10, qr: 10 },
    factoren: [
      { id: 'kop', pagina: 'lp', wat: 'Kop', varianten: [{ id: 'a', naam: 'Stop being the one who manages everything (nexy.works nu)' }, { id: 'b', naam: 'One group chat. Nexy follows up.' }, { id: 'c', naam: 'Nobody has to remember anything anymore.' }] },
      { id: 'knop', pagina: 'lp', wat: 'Tekst op de storeknop (alleen telefoon)', varianten: [{ id: 'a', naam: 'Get Nexy free' }, { id: 'b', naam: 'Start free' }] },
      { id: 'sub', pagina: 'lp', wat: 'Ondertitel onder de kop', varianten: [{ id: 'a', naam: 'At home and at work, it is you who remembers... (huidige)' }, { id: 'b', naam: 'Nexy is a messenger with an assistant built in. She remembers what was decided, plans and follows up. Free on iPhone, Android and web.' }] },
      { id: 'bewijs', pagina: 'lp', wat: 'Naast de kop', varianten: [{ id: 'a', naam: 'Drie usecases als kaarten (foto, groepschat, gesprek)' }, { id: 'b', naam: 'Eén chatvoorbeeld: wie rijdt er zaterdag, Nexy zet het in de planning' }] },
    ],
  },
  groepscadeau: {
    aan: true, ronde: 1, sinds: '2026-11-21', host: 'gids.kadoly.com',
    waarde: { start: 10, deel: 5, mee: 15, bestel: 40, koop: 100 },
    factoren: [
      { id: 'knop', pagina: 'gids', wat: 'Tekst op de startknop', varianten: [{ id: 'a', naam: 'Start een groepscadeau' }, { id: 'b', naam: 'Regel het samen met je <groep> (collega’s, ouders van de klas)' }] },
      { id: 'deeltekst', pagina: 'groep', wat: 'Tekst van het deelbericht in de groepsapp', varianten: [{ id: 'a', naam: 'X gaat weg. Ik regel een cadeau van ons allemaal: kies mee en zeg met hoeveel je meedoet' }, { id: 'b', naam: 'Samen een cadeau voor X: kies je mee? Het kost je een minuut' }] },
    ],
  },
};

// Dagronde 25 nov 2026: alleen de rijpe Duitse startfactor beslist.
// c won van a met 100% modelkans na 3.045 tegen 430 keer gezien; NL en US blijven ongewijzigd.
PROEVEN.kzuxde.factoren.find(f => f.id === 'start').varianten.find(v => v.id === 'a').uit = true;
const WV = cfg => (cfg && cfg.waarde) || WAARDE; // waardeladder per site (kassa of interactie)

const ok = s => /^[a-z0-9-]{2,30}$/.test(String(s || ''));
const dag = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const paren = h => { if (!h) return {}; if (!Array.isArray(h)) return h; const o = {}; for (let i = 0; i + 1 < h.length; i += 2) o[String(h[i])] = h[i + 1]; return o; };
function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const CFG = new Map(), ST = new Map();
// alle chats van de keuzehulpen (kzuxzorg, kzuxbatterij, kzuxrekenhulpenus ...) doen mee in de proef van hun markt (18 nov 2026, Henkjan: "die chat is centraal")
const kzuxMarkt = s => (!/^kzux/.test(s) || PROEVEN[s]) ? s : /us$/.test(s) ? 'kzuxus' : /de$/.test(s) ? 'kzuxde' : 'kzuxnl';
async function siteNaam(kv, s) { s = String(s || '').toLowerCase(); if (!ok(s)) return ''; const a = await modalAlias(kv, s).catch(() => ''); return kzuxMarkt(a || s); }
export async function leesProef(kv, site, vers = false) {
  const c = CFG.get(site); if (!vers && c && Date.now() - c.at < 60000) return c.v;
  let v = null; try { v = await kv.get('mm:proef:' + site); } catch (e) {} if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { v = null; } }
  v = v && Array.isArray(v.factoren) ? v : (PROEVEN[site] || null);
  if (v && PROEVEN[site] && N(PROEVEN[site].ronde) > N(v.ronde)) v = PROEVEN[site]; // nieuwe ronde in de code gaat voor een oudere kopie in KV
  CFG.set(site, { at: Date.now(), v }); return v;
}
async function leesTellers(kv, site, r, vers = false) {
  const k = site + ':' + r, c = ST.get(k); if (!vers && c && Date.now() - c.at < 60000) return c.v;
  let v = {}; try { v = paren(await kv.raw(['HGETALL', 'mm:pf:' + k])); } catch (e) {} ST.set(k, { at: Date.now(), v }); return v;
}
const actief = f => (f.varianten || []).filter(x => !x.uit);

// schatting per versie: dit apparaat telt vol, de andere apparaten half, plus 2 waarnemingen op het gemiddelde van het onderdeel
function schat(st, f, vs, c) {
  const g = (v, cc, x) => N(st[f.id + '|' + v + '|' + cc + '|' + x]);
  let N0 = 0, S0 = 0, Q0 = 0; const r = vs.map(x => { let n = 0, s = 0, q = 0; for (const cc of CTX) { n += g(x.id, cc, 'n'); s += g(x.id, cc, 's'); q += g(x.id, cc, 'q'); } N0 += n; S0 += s; Q0 += q; return { id: x.id, n, s, q, nc: c ? g(x.id, c, 'n') : n, sc: c ? g(x.id, c, 's') : s }; });
  const mu0 = N0 ? S0 / N0 : 0.5, var0 = Math.max(1, N0 ? Q0 / N0 - mu0 * mu0 : 1);
  return r.map(x => { const ne = x.nc + 0.5 * (x.n - x.nc) + 2, m = (x.sc + 0.5 * (x.s - x.sc) + 2 * mu0) / ne; return { ...x, m, sd: Math.sqrt(var0 / ne) }; });
}
function kies(st, f, c) {
  const vs = actief(f); if (!vs.length) return 'a'; if (vs.length === 1) return vs[0].id;
  const sch = schat(st, f, vs, c);
  if (Math.random() < (f.gelijkTot && Math.min(...sch.map(x => x.n)) < f.gelijkTot ? 1 : verken(sch))) return vs[Math.floor(Math.random() * vs.length)].id; // gelijkTot: eerst gelijk verdelen
  let best = vs[0].id, bw = -Infinity; for (const x of sch) { const w = x.m + gauss() * x.sd; if (w > bw) { bw = w; best = x.id; } } return best;
}

export async function proefBeslis(kv, { site, ctx }) {
  site = await siteNaam(kv, site); if (!site) return { ok: false, fout: 'site' };
  const cfg = await leesProef(kv, site); if (!cfg || !cfg.aan) return { ok: true, site, aan: false };
  const c = CTX.includes(ctx) ? ctx : 'd', st = await leesTellers(kv, site, N(cfg.ronde) || 1), v = {};
  for (const f of cfg.factoren) if (!f.uit) v[f.id] = kies(st, f, c);
  const a = new Uint8Array(6); globalThis.crypto.getRandomValues(a);
  return { ok: true, site, aan: true, pid: [...a].map(x => (x + 256).toString(16).slice(1)).join(''), d: dag(), r: N(cfg.ronde) || 1, v };
}

// gebeurtenis van de pagina: 'zie' (welke onderdelen stonden er, met welke versie) of een stap op weg naar betalen
export async function proefEv(kv, b) {
  const site = await siteNaam(kv, b.site), pid = String(b.pid || ''), d = String(b.d || ''), e = String(b.e || '');
  if (!site || !/^[0-9a-f]{12}$/.test(pid) || !/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^[a-z0-9]{2,12}$/.test(e)) return { ok: false, fout: 'invoer' };
  if (Date.now() - Date.parse(d) > (DAGEN - 1) * 864e5 || Date.parse(d) > Date.now() + 864e5) return { ok: false, fout: 'te oud' };
  const cfg = await leesProef(kv, site); if (!cfg) return { ok: false, fout: 'geen proef' }; if (!cfg.aan) return { ok: true, uit: true };
  const W = WV(cfg); if (e !== 'zie' && !Object.prototype.hasOwnProperty.call(W, e)) return { ok: false, fout: 'invoer' };
  const r = N(cfg.ronde) || 1; if (N(b.r) !== r) return { ok: true, oud: true };
  const hk = 'mm:pfm:' + site + ':' + d, tk = 'mm:pf:' + site + ':' + r;
  let rec = null; try { rec = JSON.parse(await kv.raw(['HGET', hk, pid]) || 'null'); } catch (x) {}
  const cmd = [];
  if (e === 'zie') {
    const c = CTX.includes(b.c) ? b.c : 'd', fs = {}; for (const f of cfg.factoren) fs[f.id] = f;
    rec = rec || { v: {}, c, f: [], m: 0, st: '' };
    const nieuw = [];
    for (const [fid, vid] of Object.entries(b.v || {})) { const f = fs[fid]; if (!f || rec.f.includes(fid) || !(f.varianten || []).some(x => x.id === vid)) continue; rec.v[fid] = vid; rec.f.push(fid); nieuw.push(fid); }
    if (!nieuw.length) return { ok: true, dubbel: true };
    const sec = b.sec == null || b.sec === '' ? null : N(b.sec);
    for (const fid of nieuw) { const vid = rec.v[fid]; cmd.push(['HINCRBY', tk, fid + '|' + vid + '|' + rec.c + '|n', 1]);
      if (fs[fid].pagina === 'kassa' && sec != null) { const sg = sec < 15 ? 'S' : 'L'; (rec.g = rec.g || {})[fid] = sg; cmd.push(['HINCRBY', tk, fid + '|' + vid + '|' + sg + '|n', 1]); } }
  } else {
    if (!rec || !rec.f.length) return { ok: true, niet: 'niets gezien' };
    const w = W[e], m = N(rec.m), eerst = !String(rec.st || '').split(',').includes(e);
    if (w <= m && !eerst) return { ok: true, dubbel: true };
    if (eerst) rec.st = (rec.st ? rec.st + ',' : '') + e;
    const dw = w > m ? w - m : 0, dq = w > m ? w * w - m * m : 0, eur = e === 'koop' ? Math.max(0, Math.min(5000, N(b.bedrag))) : 0;
    if (w > m) rec.m = w;
    for (const fid of rec.f) { const vid = rec.v[fid], p = fid + '|' + vid + '|';
      for (const cc of [rec.c, ...(rec.g && rec.g[fid] ? [rec.g[fid]] : [])]) { if (dw) { cmd.push(['HINCRBYFLOAT', tk, p + cc + '|s', dw]); cmd.push(['HINCRBYFLOAT', tk, p + cc + '|q', dq]); } }
      if (eerst) cmd.push(['HINCRBY', tk, p + '*|' + e, 1]); if (eur) cmd.push(['HINCRBYFLOAT', tk, p + '*|eur', eur]); }
  }
  cmd.push(['HSET', hk, pid, JSON.stringify(rec)], ['EXPIRE', hk, DAGEN * 86400]);
  await Promise.all(cmd.map(x => kv.raw(x)));
  return { ok: true };
}

// stand: per onderdeel en versie gezien, stappen, gemiddelde waarde, kans dat het de beste is en het aandeel dat hij nu krijgt
export async function proefStand(kv, site) {
  site = await siteNaam(kv, site); const cfg = site ? await leesProef(kv, site, true) : null; if (!cfg) return { ok: false, fout: 'geen proef voor deze site' };
  const r = N(cfg.ronde) || 1, st = await leesTellers(kv, site, r, true), g = k => N(st[k]), W = WV(cfg), STP = Object.keys(W);
  const factoren = cfg.factoren.map(f => {
    const vs = actief(f), sch = schat(st, f, vs, ''), win = Object.fromEntries(vs.map(x => [x.id, 0])), T = 4000;
    for (let i = 0; i < T; i++) { let b = '', bw = -Infinity; for (const x of sch) { const w = x.m + gauss() * x.sd; if (w > bw) { bw = w; b = x.id; } } win[b]++; }
    const nmin = Math.min(...sch.map(x => x.n)), top = Object.entries(win).sort((x, y) => y[1] - x[1])[0];
    const oordeel = top && top[1] / T >= 0.95 && nmin >= 300 ? 'winnaar: ' + top[0] : 'nog geen winnaar' + (nmin < 300 ? ' (elke versie moet 300 keer gezien zijn)' : '');
    return { id: f.id, wat: f.wat, pagina: f.pagina, uit: !!f.uit, oordeel, versies: (f.varianten || []).map(x => { const s = sch.find(y => y.id === x.id) || { n: 0, s: 0, m: 0 }, p = x.id + '|';
      const per = Object.fromEntries([...CTX, 'S', 'L'].map(cc => { const n = g(f.id + '|' + p + cc + '|n'); return [cc, { gezien: n, waarde: n ? Math.round(100 * g(f.id + '|' + p + cc + '|s') / n) / 100 : null }]; }));
      const kans = x.uit ? 0 : win[x.id] / T;
      return { id: x.id, naam: x.naam, uit: !!x.uit, gezien: s.n, stappen: Object.fromEntries(STP.map(e => [e, g(f.id + '|' + p + '*|' + e)])), omzet: Math.round(100 * g(f.id + '|' + p + '*|eur')) / 100,
        waarde: s.n ? Math.round(100 * s.s / s.n) / 100 : null, kansBeste: Math.round(100 * kans), aandeelNu: x.uit ? 0 : f.gelijkTot && nmin < f.gelijkTot ? Math.round(100 / vs.length) : Math.round(100 * (verken(sch) / vs.length + (1 - verken(sch)) * kans)), perApparaat: per }; }) };
  });
  return { ok: true, site, aan: !!cfg.aan, ronde: r, sinds: cfg.sinds || '', waarde: W, factoren };
}
export function proefTekst(s) {
  if (!s.ok) return s.fout || 'fout';
  const STAP = { b20: '20 s', veld: 'veld', methode: 'betaalmethode', betaal: 'op Betalen', koop: 'betaald', tik: 'getikt', ander: 'ander bedrijf', ster: 'sterren', vraag: 'vraag', site: 'website', route: 'route', bel: 'bellen', wa: 'WhatsApp', claim: 'claim', pill: 'pill', winkel: 'naar winkel', intentie: 'intentie (2+ velden)', gekoppeld: 'koppel assistent', start: 'gestart', uitkomst: 'uitkomst', voorwaarden: 'voorwaarden', mail: 'e-mail', verzegeld: 'verzegeld', aanvraag: 'aanvraag partij' }, STP = Object.keys(s.waarde || WAARDE);
  const L = [`Clickmind-proef ${s.site} (ronde ${s.ronde}, sinds ${s.sinds}) — ${s.aan ? 'AAN' : 'UIT'}`, `Waarde per bezoeker: ${STP.map(e => (STAP[e] || e) + ' ' + s.waarde[e]).join(', ')}.`, ''];
  for (const f of s.factoren) {
    L.push(`${f.wat} (${f.id}, ${f.pagina}${f.uit ? ', UIT' : ''}) — ${f.oordeel}`);
    for (const v of f.versies) { const pa = v.perApparaat, ap = CTX.filter(c => pa[c].gezien).map(c => `${CTX_NAAM[c]} ${pa[c].gezien}×${pa[c].waarde}`).join(', '), sn = pa.S.gezien || pa.L.gezien ? ` · snel naar kassa ${pa.S.gezien}×${pa.S.waarde ?? '-'}, rustig ${pa.L.gezien}×${pa.L.waarde ?? '-'}` : '';
      L.push(`  ${v.id}: ${v.naam}${v.uit ? ' [uit]' : ''}`, `     gezien ${v.gezien}, waarde ${v.waarde ?? '-'}, ${STP.map(e => (STAP[e] || e) + ' ' + v.stappen[e]).join(', ')}${v.omzet ? ', omzet €' + v.omzet : ''} · kans beste ${v.kansBeste}% · krijgt nu ${v.aandeelNu}%${ap ? ' · ' + ap : ''}${sn}`); }
    L.push('');
  }
  return L.join('\n');
}

// aan/uit, onderdelen aanpassen of een nieuwe ronde (tellers opnieuw; de oude ronde blijft staan)
export async function proefZet(kv, site, { aan, j, ronde }) {
  site = await siteNaam(kv, site); if (!site) return { ok: false, fout: 'site' };
  const cfg = JSON.parse(JSON.stringify((await leesProef(kv, site, true)) || { aan: false, ronde: 1, factoren: [] }));
  if (j) { const n = typeof j === 'string' ? JSON.parse(j) : j; if (!n || !Array.isArray(n.factoren) || !n.factoren.every(f => ok(f.id) && Array.isArray(f.varianten) && f.varianten.length && f.varianten.every(v => /^[a-z]$/.test(v.id)))) return { ok: false, fout: 'factoren: [{id, pagina, wat, varianten: [{id: a|b|…, naam}]}]' }; cfg.factoren = n.factoren; if (n.sinds) cfg.sinds = n.sinds; }
  if (aan != null) cfg.aan = !!aan;
  if (ronde) { cfg.ronde = (N(cfg.ronde) || 1) + 1; cfg.sinds = dag(); }
  await kv.set('mm:proef:' + site, JSON.stringify(cfg)); CFG.delete(site);
  return { ok: true, site, aan: cfg.aan, ronde: cfg.ronde, factoren: cfg.factoren.map(f => f.id + (f.uit ? ' (uit)' : '')) };
}

