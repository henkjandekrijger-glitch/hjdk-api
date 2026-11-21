// Beslisgids internet en tv op keuzehulp.best (21 nov 2026). Henkjan: "Doe alle hoge EPC s langs gaan en aanmelden of maak er een keuzehulp eerst voor ism demandradar".
// Demand Radar (NL): "internet en tv vergelijken" 12.100 per maand, het hele jaar door. Awin-programma's die erbij passen: Trined (EPC € 5,63), Odido Thuis (€ 2,70),
// Freedom Internet (€ 2,17), Internetten.nl (€ 2,15), Ziggo (€ 1,21); aanmelden zodra deze pagina live staat.
// Zelfde vorm als lib/dienstgids.js (DIENSTGIDSEN leest DIENSTGIDSEN3). Elk cijfer is gelezen op de genoemde bron op GELEZEN. Geen gedachtestreepjes.

const GELEZEN = "21 november 2026";
const DATUM = "2026-11-21";
const B = bron => bron + ", gelezen " + GELEZEN;

const OS_TV = "https://www.overstappen.nl/internet-tv";
const OS_NOV = "https://www.overstappen.nl/nieuws/dit-zijn-de-beste-internetdeals-van-november-2026/";
const KZ_GLAS = "https://www.keuze.nl/internet/goedkoop-glasvezel";
const CB = "https://www.consumentenbond.nl/internet/overzicht/over-onze-test-en-vergelijker";

// Rekenkern: wat betaal je echt per maand over de hele looptijd. Actieprijs voor n maanden, daarna de gewone prijs, min cashback, plus eenmalige kosten.
export function internetMaand(inv) {
  var p = Number(inv.p), n = Number(inv.n != null && inv.n !== '' ? inv.n : 12), r = Number(inv.r), l = Number(inv.l || 12), c = Number(inv.c || 0);
  if (!(p >= 0 && p < 300 && r > 0 && r < 300 && l >= 1 && l <= 36 && n >= 0 && n <= l && c >= 0 && c < 1000)) return null;
  var eu = function (x) { return '€ ' + Number(x).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var totaal = p * n + r * (l - n) - c, maand = totaal / l, na = r * 12;
  var h = '<p><strong>Gemiddeld ' + eu(maand) + ' per maand</strong> over ' + l + ' maanden (' + eu(totaal) + ' in totaal' + (c ? ', na ' + eu(c) + ' cashback' : '') + ').</p>' +
    '<p>Na de actie betaal je ' + eu(r) + ' per maand, ' + eu(na) + ' per jaar. Zet in je agenda wanneer je contract afloopt: dan kun je opnieuw een actieprijs krijgen.</p>';
  return { h: h, maand: Math.round(maand) };
}

export function simMaand(inv) {
  var p = Number(inv.p), n = Number(inv.n != null && inv.n !== '' ? inv.n : 12), r = Number(inv.r), l = Number(inv.l || 24), c = Number(inv.c || 0);
  if (!(p >= 0 && p < 300 && r > 0 && r < 300 && l >= 1 && l <= 36 && n >= 0 && n <= l && c >= 0 && c < 1000)) return null;
  var eu = function (x) { return '€ ' + Number(x).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var totaal = p * n + r * (l - n) - c, maand = totaal / l, na = r * 12;
  var h = '<p><strong>Gemiddeld ' + eu(maand) + ' per maand</strong> over ' + l + ' maanden (' + eu(totaal) + ' in totaal' + (c ? ', na ' + eu(c) + ' cashback' : '') + ').</p>' +
    '<p>Na de actie betaal je ' + eu(r) + ' per maand, ' + eu(na) + ' per jaar. Zet in je agenda wanneer de actie stopt: dan kun je overstappen of verlengen met korting.</p>';
  return { h: h, maand: Math.round(maand) };
}

const INTERNET = {
  slug: "internet-en-tv-vergelijken", cat: "Wonen", term: "internet en tv vergelijken", kicker: "Internet en tv · Nederland", gelezen: GELEZEN, datum: DATUM,
  title: "Internet en tv vergelijken: wie is nu het goedkoopst?",
  h1: "Internet en tv vergelijken: welk abonnement kies je in november 2026?",
  desc: "Internet en tv kost € 40 tot € 80 per maand. Eerste keus bij glasvezel: Youfone, € 24 per maand voor 8 maanden. Met rekenhulp voor je echte maandprijs.",
  kort: "Ligt er glasvezel op je adres, dan is Youfone nu de eerste keus voor internet en tv: 100 Mbit/s voor € 24,25 per maand de eerste 8 maanden, daarna € 48,50, met 28 zenders (Overstappen.nl, 21 november 2026). Wil je meer zenders, dan heeft Online.nl er 50 voor € 37,50 per maand de eerste 9 maanden, daarna € 60,50. Huishoudens betalen gemiddeld € 40 tot € 80 per maand voor internet en tv.",
  keusKop: "Internet en tv: eerste keus per situatie",
  keus: [
    ["Glasvezel, je wilt zo weinig mogelijk betalen", "Youfone, 100 Mbit/s met tv", "€ 24,25 per maand de eerste 8 maanden, daarna € 48,50, met 28 tv-zenders. Prijzen voor een woning in Den Haag; op jouw adres kan het anders zijn.", B("Overstappen.nl"), OS_TV],
    ["Je wilt meer zenders", "Online.nl, 100 Mbit/s met tv", "50 zenders voor € 37,50 per maand de eerste 9 maanden, daarna € 60,50.", B("Overstappen.nl"), OS_TV],
    ["Geen glasvezel, wel kabel", "Ziggo", "Alleen internet van 200 Mbit/s: € 34,95 per maand de eerste 6 maanden, daarna € 41,95. Bij internet en tv tot € 150 cashback. Prijzen verschillen per postcode.", "Overstappen.nl, 5 november 2026", OS_NOV],
    ["Je kijkt alleen via apps", "Alleen internet, bijvoorbeeld Youfone glasvezel", "100 Mbit/s voor € 19,50 per maand de eerste 8 maanden, daarna € 39. Voor streamen via apps heb je geen tv-pakket nodig.", "Overstappen.nl, 5 november 2026", OS_NOV],
    ["Je wilt een 2-jarig contract", "Kijk naar de Black Friday-acties", "Bij 2 jaar geeft hollandsnieuwe internet en tv voor € 20 per maand de eerste 12 maanden, en DELTA internet voor € 25 per maand de eerste 12 maanden. De prijs daarna noemt de bron niet; vraag die op.", "Overstappen.nl, 5 november 2026", OS_NOV]
  ],
  secties: [
    ["kosten", "Wat kost internet en tv per maand?", ["Nederlandse huishoudens betalen voor internet en tv gemiddeld € 40 tot € 80 per maand (Overstappen.nl). De actieprijs geldt alleen de eerste 6 tot 9 maanden; daarna betaal je de gewone prijs. Reken dus altijd met het gemiddelde over de hele looptijd: dat doet de rekenhulp op deze pagina.", "Bij een instapabonnement kan het verschil met de goedkoopste aanbieder oplopen tot € 265,50 per jaar voor internet en tv (Keuze.nl, 13 juli 2026)."]],
    ["glasvezel", "Glasvezel, kabel of DSL?", ["Welke verbinding je kunt krijgen hangt af van je adres. Glasvezel is het snelst en vaak het goedkoopst in de actie; Youfone, Odido en Budget Thuis zijn volgens Keuze.nl vaak de goedkoopste glasvezelaanbieders. Freedom Internet, Online.nl en Solcon zijn daar zelden de goedkoopste, ook niet met een aanbieding.", "Heb je geen glasvezel, dan is kabel (Ziggo) meestal de snelste keus."]],
    ["overstappen", "Overstappen: waar let je op?", ["Kijk wanneer je huidige contract afloopt. Na de minimale looptijd kun je meestal per maand opzeggen, en een nieuwe aanbieder regelt de overstap vaak voor je. Vraag naar eenmalige kosten voor aansluiten of een modem en tel die mee in de rekenhulp."]]
  ],
  faq: [
    ["Wat is het goedkoopste internet en tv abonnement?", "Met glasvezel is Youfone nu het goedkoopst: 100 Mbit/s met 28 zenders voor € 24,25 per maand de eerste 8 maanden, daarna € 48,50 (Overstappen.nl, 21 november 2026). Wil je meer zenders, dan heeft Online.nl 50 zenders voor € 37,50 per maand de eerste 9 maanden, daarna € 60,50. Welke aanbieder op jouw adres het goedkoopst is, hangt af van de verbinding die er ligt."],
    ["Wat kost internet en tv per maand?", "Gemiddeld € 40 tot € 80 per maand (Overstappen.nl). Met een actie betaal je de eerste maanden minder; reken het gemiddelde over de hele looptijd uit met de rekenhulp."],
    ["Heb ik een tv-pakket nodig?", "Niet als je alleen via apps kijkt. Alleen internet met glasvezel kost bij Youfone € 19,50 per maand de eerste 8 maanden, daarna € 39 (Overstappen.nl, 5 november 2026)."],
    ["Ziggo of glasvezel?", "Ligt er glasvezel, dan is dat vaak goedkoper in de actie. Ziggo werkt via de kabel en is meestal de snelste keus als er geen glasvezel ligt: 200 Mbit/s voor € 34,95 per maand de eerste 6 maanden, daarna € 41,95."],
    ["Is een 2-jarig contract slim?", "Alleen als de actie langer loopt. Bij 2 jaar geven sommige aanbieders langer korting, zoals hollandsnieuwe met internet en tv voor € 20 per maand de eerste 12 maanden. Vraag altijd de prijs na de actie op."]
  ],
  bronnen: [
    ["Overstappen.nl: internet en tv vergelijken, top 5 van november 2026 (bijgewerkt 21 november 2026)", OS_TV],
    ["Overstappen.nl: de beste internetdeals van november 2026 (5 november 2026)", OS_NOV],
    ["Keuze.nl: goedkoopste glasvezel (13 juli 2026)", KZ_GLAS],
    ["Consumentenbond: hoe we internetaanbieders vergelijken (28 augustus 2026)", CB]
  ],
  verder: [["Energie vergelijken", "/energieleverancier-vergelijken"], ["iPhone 18 kopen", "/iphone-18"], ["Mesh wifi kiezen", "/mesh-wifi"]],
  reken: {
    id: "net", kop: "Wat betaal je echt per maand?", fn: internetMaand,
    tekst: "Vul de actieprijs, hoe lang die geldt en de gewone prijs in.",
    velden: [["p", "Actieprijs per maand (€)", 24.25, 0, 300, 0.01], ["n", "Maanden actieprijs", 8, 0, 36, 1], ["r", "Gewone prijs per maand (€)", 48.5, 1, 300, 0.01], ["l", "Looptijd (maanden)", 12, 1, 36, 1], ["c", "Cashback (€)", 0, 0, 1000, 1]],
    tabel: { kop: "Gemiddeld per maand over 12 maanden", kol: ["Aanbod", "Gemiddeld per maand"], rijen: [["Youfone glasvezel 100 met tv", { p: 24.25, n: 8, r: 48.5, l: 12, c: 0 }], ["Online.nl glasvezel 100 met tv", { p: 37.5, n: 9, r: 60.5, l: 12, c: 0 }], ["Youfone glasvezel 100, alleen internet", { p: 19.5, n: 8, r: 39, l: 12, c: 0 }]] },
    chat: {
      wat: "internet", tot: 3, voortg: "{n} van {t} klaar", ph: "Of typ je vraag over internet en tv",
      st: [
        { f: "p", v: "Wat is de actieprijs per maand?", p: [["€ 19,50", "19.5"], ["€ 24,25", "24.25"], ["€ 34,95", "34.95"], ["€ 37,50", "37.5"]], ander: { l: "Andere prijs", ph: "Bijvoorbeeld 29,95", voor: "€ ", min: 0, max: 300 } },
        { f: "n", v: "Hoeveel maanden geldt die prijs?", p: [["6 maanden", "6"], ["8 maanden", "8"], ["9 maanden", "9"], ["12 maanden", "12"]] },
        { f: "r", v: "Wat is de gewone prijs daarna?", p: [["€ 39", "39"], ["€ 48,50", "48.5"], ["€ 55,90", "55.9"], ["€ 60,50", "60.5"]], ander: { l: "Andere prijs", ph: "Bijvoorbeeld 52,50", voor: "€ ", min: 1, max: 300 } }
      ],
      na: [{ l: "Energie vergelijken", s: "link", href: "/energieleverancier-vergelijken" }, { l: "Alles zelf invullen", s: "zelf" }]
    }
  }
};

// ---------- Sim only (Demand Radar NL: "sim only" 18.100 en "sim only vergelijken" 8.100 per maand; Awin: Simyo € 2,26, 50plus Mobiel € 2,07) ----------
const BS_BF = "https://www.belsimpel.nl/nieuws/2744/beste-sim-only-black-friday-deals-van-deze-week";
const KZ_SIM = "https://www.keuze.nl/sim-only";

const SIM = {
  slug: "sim-only", cat: "Elektronica", term: "sim only vergelijken", kicker: "Sim only · Nederland", gelezen: GELEZEN, datum: DATUM,
  title: "Sim only vergelijken: de goedkoopste deal van november 2026",
  h1: "Sim only vergelijken: welk abonnement kies je in november 2026?",
  desc: "Eerste keus: Simyo 20 GB, € 3,50 per maand het eerste jaar en € 125 cashback, € 49 over 2 jaar. Met rekenhulp voor wat je echt betaalt.",
  kort: "De goedkoopste sim only is nu Simyo met 20 GB: € 3,50 per maand het eerste jaar, daarna € 11, en € 125 cashback, dus € 49 over 2 jaar (Belsimpel, 16 november 2026). Bel je veel, dan krijg je bij 50+ mobiel 45 GB met onbeperkt bellen en sms voor € 2,50 per maand het eerste jaar, daarna € 10: € 150 over 2 jaar. Onbeperkt data: KPN SuperUnlimited voor € 32,50 per maand.",
  keusKop: "Sim only: eerste keus per situatie",
  keus: [
    ["Zo weinig mogelijk betalen", "Simyo, 20 GB", "€ 3,50 per maand de eerste 12 maanden, daarna € 11, met € 125 cashback: € 49 over 24 maanden. 400 minuten of sms per maand.", B("Belsimpel, gecontroleerd 16 november 2026"), BS_BF],
    ["Je belt veel", "50+ mobiel, 45 GB", "Onbeperkt bellen en sms, € 2,50 per maand de eerste 12 maanden, daarna € 10: € 150 over 24 maanden.", B("Belsimpel"), BS_BF],
    ["Veel data, onbeperkt bellen", "hollandsnieuwe, 40 GB", "€ 4,50 per maand de eerste 12 maanden, daarna € 12, met een Sennheiser-koptelefoon erbij. Bestel uiterlijk 6 december 2026.", B("Belsimpel"), BS_BF],
    ["Onbeperkt data", "KPN SuperUnlimited 700", "€ 32,50 per maand, met een Sony WH-1000XM6 erbij. Bestel uiterlijk 6 december 2026.", B("Belsimpel"), BS_BF],
    ["Je wilt per maand kunnen opzeggen", "Een sim only met looptijd van 1 maand", "Dan betaal je de gewone prijs zonder actie. Vergelijk op data en belminuten; de goedkoopste hebben meestal de kleinste bundel.", "Keuze.nl", KZ_SIM]
  ],
  secties: [
    ["kosten", "Wat kost sim only per maand?", ["De acties van november 2026 geven het eerste jaar korting: van € 1 tot € 5,50 per maand, daarna € 10 tot € 12 voor 20 tot 45 GB (Belsimpel, 16 november 2026). Reken altijd over de hele looptijd en trek cashback af: dat doet de rekenhulp op deze pagina.", "Een cadeau zoals een koptelefoon telt niet als korting op je abonnement; Belsimpel trekt alleen cashback af van de kosten."]],
    ["data", "Hoeveel data heb je nodig?", ["Kijk in de instellingen van je telefoon hoeveel mobiele data je de laatste maanden gebruikte en neem een bundel die daar net boven zit. Sommige aanbieders geven extra data als je ook internet thuis bij hun netwerk hebt, zoals Simyo met tot 10 GB extra bij internet van KPN (Keuze.nl)."]],
    ["overstappen", "Overstappen en je nummer houden", ["Je nummer meenemen is gratis. Na de minimale looptijd van je oude abonnement regelt de nieuwe aanbieder vaak de opzegging. Bij een 2-jarig contract met actie betaal je na de actieperiode de gewone prijs: zet die datum in je agenda."]]
  ],
  faq: [
    ["Wat is de goedkoopste sim only?", "Nu Simyo met 20 GB: € 3,50 per maand de eerste 12 maanden, daarna € 11, met € 125 cashback, € 49 over 2 jaar (Belsimpel, 16 november 2026). Bel je veel, dan is 50+ mobiel met 45 GB en onbeperkt bellen € 150 over 2 jaar."],
    ["Wat is sim only?", "Een mobiel abonnement zonder telefoon: je betaalt alleen voor data, bellen en sms, geen toestelkosten (Keuze.nl)."],
    ["Is een 2-jarig contract slim?", "Bij de acties van nu wel: de korting en cashback gelden bij 2 jaar. Reken met de rekenhulp uit wat je over 24 maanden betaalt."],
    ["Wat is beter: cashback of een cadeau?", "Cashback verlaagt je kosten direct. Een cadeau is alleen voordeel als je het zelf wilde kopen."],
    ["Kan ik mijn nummer houden?", "Ja, nummerbehoud is gratis en de nieuwe aanbieder regelt de overstap."]
  ],
  bronnen: [["Belsimpel: beste sim only Black Friday-deals (gecontroleerd 16 november 2026)", BS_BF], ["Keuze.nl: sim only vergelijken", KZ_SIM]],
  verder: [["iPhone 18 kopen", "/iphone-18"], ["Internet en tv vergelijken", "/internet-en-tv-vergelijken"], ["Powerbank kiezen", "/powerbank"]],
  reken: {
    id: "sim", kop: "Wat betaal je echt over 2 jaar?", fn: simMaand,
    tekst: "Vul de actieprijs, hoe lang die geldt, de gewone prijs en de cashback in.",
    velden: [["p", "Actieprijs per maand (€)", 3.5, 0, 300, 0.01], ["n", "Maanden actieprijs", 12, 0, 36, 1], ["r", "Gewone prijs per maand (€)", 11, 1, 300, 0.01], ["l", "Looptijd (maanden)", 24, 1, 36, 1], ["c", "Cashback (€)", 125, 0, 1000, 1]],
    tabel: { kop: "Gemiddeld per maand over 24 maanden", kol: ["Aanbod", "Gemiddeld per maand"], rijen: [["Simyo 20 GB, € 125 cashback", { p: 3.5, n: 12, r: 11, l: 24, c: 125 }], ["50+ mobiel 45 GB", { p: 2.5, n: 12, r: 10, l: 24, c: 0 }], ["hollandsnieuwe 40 GB", { p: 4.5, n: 12, r: 12, l: 24, c: 0 }]] },
    chat: {
      wat: "sim only", tot: 3, voortg: "{n} van {t} klaar", ph: "Of typ je vraag over sim only",
      st: [
        { f: "p", v: "Wat is de actieprijs per maand?", p: [["€ 2,50", "2.5"], ["€ 3,50", "3.5"], ["€ 4,50", "4.5"], ["€ 5,50", "5.5"]], ander: { l: "Andere prijs", ph: "Bijvoorbeeld 6,50", voor: "€ ", min: 0, max: 300 } },
        { f: "r", v: "Wat is de gewone prijs daarna?", p: [["€ 10", "10"], ["€ 11", "11"], ["€ 12", "12"], ["€ 17,50", "17.5"]], ander: { l: "Andere prijs", ph: "Bijvoorbeeld 15", voor: "€ ", min: 1, max: 300 } },
        { f: "c", v: "Hoeveel cashback krijg je?", p: [["Geen", "0"], ["€ 75", "75"], ["€ 100", "100"], ["€ 125", "125"]] }
      ],
      na: [{ l: "Internet en tv vergelijken", s: "link", href: "/internet-en-tv-vergelijken" }, { l: "Alles zelf invullen", s: "zelf" }]
    }
  }
};

export const DIENSTGIDSEN3 = { "internet-en-tv-vergelijken": INTERNET, "sim-only": SIM };
