// Beslisgidsen op keuzehulp.best voor de AI-gaten van Demand Radar die op 19 nov 2026 nog geen pagina hadden:
// iphone 18 (411.000 per maand) en elektrische auto (radar: "elektriciteit auto", 201.000 per maand).
// Zelfde vorm als lib/dienstgids.js (DIENSTGIDSEN leest DIENSTGIDSEN2), eigen bestand om botsingen met andere chats te vermijden.
// Henkjan 19 nov 2026: "Maak ze". Protocol: .claude/skills/keuzehulp-bouw/SKILL.md (één eerste keus, koopvraag als eerste FAQ, elk feit met bron, rekenhulp).
// Elk cijfer is gelezen op de genoemde bron op GELEZEN. Geen gedachtestreepjes. De rekenkernen staan los en draaien ook in de browser (chat).

const GELEZEN = "20 november 2026";
const DATUM = "2026-11-20";
const B = bron => bron + ", gelezen " + GELEZEN;

// ---------- iPhone 18 ----------
const IPHONED_PRIJS = "https://www.iphoned.nl/nieuws/iphone-18-pro-iphone-18-pro-max-officiele-prijzen/";
const IPHONED_VGL = "https://www.iphoned.nl/apple/iphone-18-pro/prijzen/";
const IPHONED_PRO = "https://www.iphoned.nl/apple/iphone-18-pro/";
const IPHONED_EU = "https://www.iphoned.nl/nieuws/europese-iphone-18-pro-veel-duurder/";
const BRIGHT = "https://www.bright.nl/nieuws/2133829/zoveel-duurder-is-apple-dit-jaar-de-nederlandse-iphone-prijzen-vergeleken.html";
const PROVIDERS = "https://www.providers.nl/nieuws/iphone-18-pro-prijzen-pre-order-nederland/";
const ICREATE = "https://www.icreatemagazine.nl/?p=283010";

// Rekenkern: wat kost een toestel per maand als je het los koopt en er sim-only bij neemt.
export function iphoneMaand(inv) {
  var t = Number(inv.t), m = Number(inv.m), s = Number(inv.s);
  if (!(t >= 100 && t <= 5000 && m >= 1 && m <= 72 && s >= 0 && s <= 100)) return null;
  var eu = function (n) { return "€ " + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var toestel = t / m, maand = toestel + s, totaal = t + s * m;
  var h = "<p><strong>Ongeveer " + eu(maand) + " per maand</strong> over " + m + " maanden.</p>" +
    "<p>Toestel " + eu(t) + " gedeeld door " + m + " maanden is " + eu(toestel) + " per maand, plus " + eu(s) + " sim-only. In totaal " + eu(totaal) + ". Vergelijk dat met wat een abonnement met toestel in totaal kost.</p>";
  return { h: h, maand: Math.round(maand) };
}

const IPHONE = {
  slug: "iphone-18", cat: "Elektronica", term: "iphone 18", kicker: "iPhone 18 · Nederland", gelezen: GELEZEN, datum: DATUM,
  title: "iPhone 18 kopen: welke kies je en wat kost hij?",
  h1: "iPhone 18: welke koop je en wat kost hij?",
  desc: "iPhone 18 Pro kost € 1.479, de Pro Max € 1.629. De gewone iPhone 18 komt begin 2027. Eerste keus per situatie, met rekenhulp voor de prijs per maand.",
  kort: "Wil je nu een iPhone 18, dan is de iPhone 18 Pro met 256 GB de eerste keus: € 1.479 bij Apple, te koop sinds 18 september 2026. De gewone iPhone 18 is er nog niet en wordt begin 2027 verwacht. Wil je minder uitgeven, dan is de iPhone 17 er vanaf € 859 en de iPhone 17 Pro vanaf € 1.195 in de prijsvergelijker van iPhoned. Lever je een iPhone 13 of nieuwer in, dan haalt Apple er € 150 tot € 1.020 af.",
  keusKop: "iPhone 18: eerste keus per situatie",
  keus: [
    ["Je wilt nu de nieuwste iPhone", "iPhone 18 Pro, 256 GB", "Kost € 1.479 bij Apple en ligt sinds 18 september 2026 in de winkel. Dat is € 150 meer dan de iPhone 17 Pro bij zijn introductie.", B("iPhoned"), IPHONED_PRIJS],
    ["Je wilt het grootste scherm", "iPhone 18 Pro Max, 256 GB", "Kost € 1.629. Met 512 GB betaal je € 1.879.", B("iPhoned"), IPHONED_PRIJS],
    ["Je wacht op de gewone iPhone 18", "Wachten tot begin 2027, of nu een iPhone 17", "In september 2026 kwamen alleen de Pro-modellen uit. De gewone iPhone 18 wordt begin 2027 verwacht; iPhoned noemt februari 2027. De iPhone 17 is er vanaf € 859.", B("iPhoned prijsvergelijker"), IPHONED_VGL],
    ["Je wilt zo min mogelijk uitgeven", "iPhone 17", "Vanaf € 859 in de prijsvergelijker van iPhoned. De iPhone 17 Pro is er vanaf € 1.195, € 284 minder dan de iPhone 18 Pro.", B("iPhoned prijsvergelijker"), IPHONED_PRO],
    ["Je hebt een iPhone 13 of nieuwer", "Inruilen bij Apple", "Apple haalt € 150 tot € 1.020 van de prijs af als je een iPhone 13 of nieuwer inlevert.", B("Providers.nl"), PROVIDERS],
    ["Je wilt een vouwbare iPhone", "iPhone Duo, 256 GB", "Vanaf € 2.339, volgens Providers.nl leverbaar vanaf 23 oktober 2026.", B("Bright en Providers.nl"), BRIGHT]
  ],
  secties: [
    ["prijzen", "Wat kost de iPhone 18?", [
      "De iPhone 18 Pro kost bij Apple € 1.479 met 256 GB, € 1.729 met 512 GB, € 2.229 met 1 TB en € 2.979 met 2 TB.",
      "De iPhone 18 Pro Max kost € 1.629 met 256 GB, € 1.879 met 512 GB, € 2.379 met 1 TB en € 3.129 met 2 TB.",
      "De vouwbare iPhone Duo begint bij € 2.339 met 256 GB en kost € 2.589 met 512 GB.",
      "Apple maakte de prijzen bekend op 9 september 2026. De Pro-modellen zijn sinds 18 september te koop, de Duo vanaf 23 oktober."]],
    ["wachten", "Loont wachten op de gewone iPhone 18?", [
      "De gewone iPhone 18 is nog niet uit. Dit najaar kwamen voor het eerst alleen de duurdere modellen; het gewone model wordt begin 2027 verwacht.",
      "Heb je nu een telefoon nodig, dan is de iPhone 17 het alternatief: vanaf € 859 in de prijsvergelijker van iPhoned.",
      "Kan je huidige telefoon nog een paar maanden mee, dan kun je de prijs van de gewone iPhone 18 afwachten."]],
    ["los-of-abonnement", "Los toestel of met abonnement?", [
      "Reken altijd de totale prijs uit: wat je per maand betaalt keer het aantal maanden, plus wat je vooraf betaalt.",
      "Vergelijk dat met de prijs van het losse toestel plus een sim-only abonnement. De rekenhulp hieronder doet dat voor je.",
      "Met een los toestel zit je niet vast aan één provider."]],
    ["nederland", "Werkt alles in Nederland?", [
      "Niet meteen. Volgens iPhoned mis je in Nederland voorlopig een belangrijk onderdeel van de nieuwste software, terwijl de Europese prijs hoger is.",
      "Controleer bij Apple welke functies in Nederland werken voordat je daarvoor meer betaalt."]]
  ],
  faq: [
    ["Welke iPhone 18 kun je het beste kopen en waar?", "Onze eerste keus is de iPhone 18 Pro met 256 GB: € 1.479 bij Apple, te koop sinds 18 september 2026. Lever je een iPhone 13 of nieuwer in, dan gaat er bij Apple € 150 tot € 1.020 af. De gewone iPhone 18 is er nog niet. Wil je minder uitgeven, dan is de iPhone 17 er vanaf € 859."],
    ["Wanneer komt de gewone iPhone 18 uit?", "De gewone iPhone 18 wordt begin 2027 verwacht; iPhoned noemt februari 2027. In september 2026 kwamen alleen de iPhone 18 Pro en de iPhone 18 Pro Max uit."],
    ["Wat kost de iPhone 18 Pro in Nederland?", "€ 1.479 met 256 GB, € 1.729 met 512 GB, € 2.229 met 1 TB en € 2.979 met 2 TB. De iPhone 18 Pro Max begint bij € 1.629."],
    ["Is de iPhone 18 Pro duurder dan de iPhone 17 Pro?", "Ja. De iPhone 18 Pro kost € 1.479 en de iPhone 17 Pro kostte bij introductie € 1.329. Dat is € 150 meer."],
    ["Wat is de goedkoopste nieuwe iPhone?", "Van de modellen op deze pagina is dat de iPhone 17, vanaf € 859 in de prijsvergelijker van iPhoned op 20 november 2026."],
    ["Wat krijg je voor je oude iPhone bij Apple?", "Volgens Providers.nl € 150 tot € 1.020 korting op een iPhone 18 Pro of iPhone Duo als je een iPhone 13 of nieuwer inlevert."],
    ["Wat kost een iPhone 18 Pro per maand?", "Los gekocht voor € 1.479 en gedeeld door 24 maanden is dat € 61,63 per maand, zonder abonnement. Over 36 maanden is het € 41,08. Met de rekenhulp tel je er je sim-only bij op."]
  ],
  bronnen: [
    ["iPhoned: officiële prijzen iPhone 18 Pro en Pro Max", IPHONED_PRIJS],
    ["Bright: Nederlandse iPhone-prijzen vergeleken", BRIGHT],
    ["Providers.nl: iPhone 18 Pro, prijzen en pre-order", PROVIDERS],
    ["iPhoned: prijsvergelijker (iPhone 17 vanaf € 859, gewone iPhone 18 in februari 2027)", IPHONED_VGL],
    ["iPhoned: iPhone 18 Pro (iPhone 17 Pro vanaf € 1.195)", IPHONED_PRO],
    ["iPhoned: Europese iPhone 18 Pro duurder", IPHONED_EU],
    ["iCreate: gewone iPhone 18 begin 2027", ICREATE]
  ],
  verder: [["Koptelefoon kiezen", "/koptelefoon"]],
  reken: {
    id: "iphone", kop: "Wat kost een iPhone 18 per maand?", fn: iphoneMaand,
    tekst: "Vul de prijs van het toestel, het aantal maanden en je sim-only in.",
    velden: [["t", "Prijs toestel (€)", 1479, 100, 5000, 1], ["m", "Aantal maanden", 24, 1, 72, 1], ["s", "Sim-only per maand (€)", 15, 0, 100, 0.5]],
    tabel: { kop: "Per maand bij een sim-only van € 15", kol: ["Toestel", "24 maanden", "36 maanden", "48 maanden"], rijen: [["iPhone 18 Pro, 256 GB", 1479], ["iPhone 18 Pro Max, 256 GB", 1629], ["iPhone 17, vanaf", 859]].map(([l, t]) => [l, { t, m: 24, s: 15 }, { t, m: 36, s: 15 }, { t, m: 48, s: 15 }]) },
    chat: {
      wat: "iPhone 18", tot: 3, voortg: "{n} van {t} klaar", ph: "Of typ je vraag over de iPhone 18",
      st: [
        { f: "t", v: "Welke iPhone wil je?", p: [["iPhone 18 Pro, € 1.479", "1479"], ["iPhone 18 Pro Max, € 1.629", "1629"], ["iPhone 17, vanaf € 859", "859"]], ander: { l: "Andere prijs", ph: "Bijvoorbeeld 1729", voor: "€ ", min: 100, max: 5000 } },
        { f: "m", v: "Hoe lang doe je ermee?", p: [["2 jaar", "24"], ["3 jaar", "36"], ["4 jaar", "48"]] },
        { f: "s", v: "Wat betaal je voor sim-only per maand?", p: [["€ 10", "10"], ["€ 15", "15"], ["€ 25", "25"]], ander: { l: "Ander bedrag", ph: "Bijvoorbeeld 12", voor: "€ ", min: 0, max: 100 } }
      ],
      na: [{ l: "Alles zelf invullen", s: "zelf" }]
    }
  }
};

// ---------- Elektrische auto ----------
const ANWB_VS = "https://www.anwb.nl/auto/elektrisch-rijden/elektrisch-versus-benzine-versus-hybride";
const ANWB_VS2 = "https://www.anwb.nl/auto/elektrisch-rijden/kosten/elektrische-auto-vs-benzine-vs-hybride";
const ANWB_PERS = "https://www.anwb.nl/over-anwb/anwb-actueel/persinformatie/persberichten/2026/gemiddelde-laadkosten-per-gemeente-in-2025";
const ANWB_LAAD = "https://www.anwb.nl/auto/elektrisch-rijden/kosten/wat-kost-elektrisch-laden";
const ANWB_FISC = "https://www.anwb.nl/zakelijk/elektrisch-rijden/fiscale-voordelen";
const RVO = "https://www.rvo.nl/onderwerpen/elektrisch-vervoer/financiele-ondersteuning";
const RVO2 = "https://www.rvo.nl/onderwerpen/financiele-ondersteuning-elektrisch-rijden";
const AYVENS = "https://www.ayvens.com/nl-nl/blog/wetgeving-en-regelgeving/elektrisch-leasen-in-2026-alle-financiele-veranderingen-voor-leaserijders-op-een-rij/";
const AS24 = "https://www.autoscout24.nl/informeren/advies/besluit-en-aankoop/elektrische-auto-in-2025/";
const MKB = "https://www.mkbservicedesk.nl/1/regelingen-voor-elektrisch-rijden.htm";
const EVKX = "https://evkx.net/nl/rankings/netherlands/";
const AUTOREVIEW = "https://www.autoreview.nl/nieuws/id/37377/5-goedkoopste-elektrische-autos-van-nederland";

// Rekenkern: laadkosten per maand = kilometers per maand x verbruik (kWh per 100 km) x prijs per kWh.
export function laadKosten(inv) {
  var k = Number(inv.k), v = Number(inv.v), p = Number(inv.p);
  if (!(k >= 50 && k <= 10000 && v >= 8 && v <= 40 && p >= 0.05 && p <= 2)) return null;
  var eu = function (n) { return "€ " + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var kwh = k * v / 100, maand = kwh * p, per100 = v * p;
  var h = "<p><strong>Ongeveer " + eu(maand) + " per maand</strong> aan stroom.</p>" +
    "<p>" + Math.round(k).toLocaleString("nl-NL") + " km per maand bij " + String(v).replace(".", ",") + " kWh per 100 km is " + Math.round(kwh).toLocaleString("nl-NL") + " kWh. Bij " + eu(p) + " per kWh is dat " + eu(per100) + " per 100 km. Ter vergelijking: de ANWB rekent voor 2026 met 29 cent thuis, 47 cent openbaar en 73 cent bij een snellader.</p>";
  return { h: h, maand: Math.round(maand) };
}

const EV = {
  slug: "elektrische-auto", cat: "Auto & onderweg", term: "elektrische auto", kicker: "Elektrische auto · Nederland", gelezen: GELEZEN, datum: DATUM,
  title: "Elektrische auto kopen of leasen: wat kost het in 2026?",
  h1: "Elektrische auto: kopen of leasen, en wat kost laden?",
  desc: "Elektrische auto: thuis laden kost gemiddeld 29 cent per kWh, openbaar 47 en snelladen 73. Eerste keus per situatie, belastingen 2026 en rekenhulp.",
  kort: "Kun je thuis laden, dan is een elektrische auto de eerste keus: thuis betaal je gemiddeld 29 cent per kWh, tegen 47 cent aan een openbare paal en 73 cent bij een snellader (ANWB, tarieven 2026). Heb je geen eigen laadplek, zoek dan eerst het tarief van de paal in je straat op, want dat verschilt sterk per gemeente. Nieuw begint een elektrische auto bij € 20.990 en private lease bij € 249 per maand. In 2026 krijg je 30% korting op de wegenbelasting.",
  keusKop: "Elektrische auto: eerste keus per situatie",
  keus: [
    ["Je hebt een eigen oprit of parkeerplek", "Elektrisch rijden en thuis laden", "Thuis laden kost gemiddeld 29 cent per kWh. Openbaar laden kost 47 cent en snelladen 73 cent. Bij 15.000 km per jaar rekent de ANWB gemiddeld met 39 cent.", B("ANWB"), ANWB_VS],
    ["Je hebt geen eigen laadplek", "Eerst het tarief van de laadpaal in je straat opzoeken", "In 2025 betaalden rijders gemiddeld 48 cent per kWh aan openbare laadpalen, en de tarieven verschillen sterk per gemeente. Reken met dat tarief voordat je kiest.", B("ANWB"), ANWB_PERS],
    ["Je krijgt een auto van de zaak", "Een elektrische auto met een cataloguswaarde tot € 30.000", "In 2026 betaal je 18% bijtelling over de eerste € 30.000 en 22% over het deel daarboven.", B("ANWB"), ANWB_FISC],
    ["Je zoekt de goedkoopste nieuwe", "Renault Twingo E-Tech, of private lease", "De goedkoopste nieuwe elektrische auto in de ranglijst van EVKX is de Renault Twingo E-Tech vanaf € 20.990, daarna de BYD Dolphin Surf vanaf € 22.990. Private lease begint bij € 249 per maand voor een Dacia Spring (72 maanden, 5.000 km per jaar).", B("EVKX en Autoreview"), EVKX],
    ["Je rijdt vaak lange stukken", "Een model met minstens 500 km bereik", "De goedkoopste met 500 km bereik is volgens EVKX de Tesla Model 3 vanaf € 36.990. Onderweg snelladen is het duurst: gemiddeld 73 cent per kWh.", B("EVKX en ANWB"), EVKX],
    ["Je twijfelt tussen elektrisch en benzine", "Reken je laadkosten per maand uit", "De rekenhulp laat zien wat je per maand aan stroom betaalt bij thuis laden, openbaar laden en snelladen.", "Rekenhulp op deze pagina", "#rekenhulp"]
  ],
  secties: [
    ["laden", "Wat kost het laden van een elektrische auto?", [
      "De ANWB rekent voor 2026 met gemiddeld 29 cent per kWh thuis, 47 cent aan een openbare laadpaal en 73 cent bij een snellader.",
      "Wie 60% thuis laadt, 30% openbaar en 10% bij een snellader, komt bij 15.000 km per jaar uit op gemiddeld 39 cent per kWh.",
      "Aan openbare laadpalen betaalden rijders in 2025 gemiddeld 48 cent per kWh. Dat verschilt sterk per gemeente.",
      "Snelladers rekenen € 0,65 tot € 0,90 per kWh. Met een abonnement bij de aanbieder daalt dat bedrag."]],
    ["belasting", "Belastingen in 2026", [
      "Wegenbelasting: sinds 1 januari 2026 krijg je 30% korting op de motorrijtuigenbelasting voor een volledig elektrische auto. Die korting geldt tot en met 2028. In 2029 is de korting 25% en vanaf 2030 betaal je het normale tarief.",
      "Aanschafbelasting: voor een nieuwe elektrische auto betaal je in 2026 een vast bedrag van € 687 aan bpm. In 2025 was dat € 667.",
      "Bijtelling: 18% over de eerste € 30.000 van de cataloguswaarde en 22% over het deel daarboven, voor auto's die in 2026 voor het eerst op kenteken gaan.",
      "Subsidie: sinds 2025 kunnen particulieren geen landelijke aanschafsubsidie (SEPP) meer aanvragen. Sommige gemeenten hebben nog een eigen regeling."]],
    ["prijzen", "Wat kost een elektrische auto?", [
      "Volgens de ranglijst van EVKX zijn er in Nederland 198 elektrische auto's te koop. De goedkoopste is de Renault Twingo E-Tech vanaf € 20.990, gevolgd door de BYD Dolphin Surf vanaf € 22.990.",
      "Private lease begint volgens Autoreview bij € 249 per maand voor een Dacia Spring, € 279 voor een Leapmotor T03 en € 319 voor een Fiat Grande Panda, bij 72 maanden en 5.000 km per jaar.",
      "Voor lange ritten telt het bereik zwaarder dan de vanafprijs. De goedkoopste auto met minstens 500 km bereik is de Tesla Model 3 vanaf € 36.990."]]
  ],
  faq: [
    ["Welke elektrische auto kun je het beste kopen en waar begin je?", "Begin bij de vraag of je thuis kunt laden. Kan dat, dan is elektrisch de eerste keus: thuis laden kost gemiddeld 29 cent per kWh, tegen 47 cent openbaar en 73 cent bij een snellader. De goedkoopste nieuwe elektrische auto is de Renault Twingo E-Tech vanaf € 20.990 en private lease begint bij € 249 per maand. Kun je niet thuis laden, zoek dan eerst het tarief van de laadpaal in je straat op."],
    ["Wat kost het opladen van een elektrische auto?", "Gemiddeld 29 cent per kWh thuis, 47 cent aan een openbare laadpaal en 73 cent bij een snellader, volgens de ANWB voor 2026. Bij een verbruik van 17 kWh per 100 km is dat thuis ongeveer € 4,93 per 100 km."],
    ["Betaal je wegenbelasting voor een elektrische auto?", "Ja. Sinds 1 januari 2026 betaal je 70% van het normale tarief, dus 30% korting. Dat blijft zo tot en met 2028. In 2029 is de korting 25% en vanaf 2030 betaal je het volle tarief."],
    ["Hoeveel bijtelling betaal je voor een elektrische auto in 2026?", "18% over de eerste € 30.000 van de cataloguswaarde en 22% over het deel daarboven."],
    ["Is er nog subsidie op een elektrische auto?", "Particulieren kunnen sinds 2025 geen landelijke aanschafsubsidie (SEPP) meer aanvragen. Sommige gemeenten hebben nog een eigen regeling."],
    ["Wat is de goedkoopste elektrische auto?", "In de ranglijst van EVKX is dat de Renault Twingo E-Tech vanaf € 20.990. In private lease is de Dacia Spring het goedkoopst, vanaf € 249 per maand bij 72 maanden en 5.000 km per jaar."],
    ["Is elektrisch rijden ook goedkoop zonder eigen laadpaal?", "Dat hangt af van het tarief in je gemeente. Openbaar laden kostte in 2025 gemiddeld 48 cent per kWh, ruim anderhalf keer zoveel als thuis. Reken het na met de rekenhulp."]
  ],
  bronnen: [
    ["ANWB: elektrisch, benzine of hybride (29, 47 en 73 cent per kWh, gemiddeld 39)", ANWB_VS],
    ["ANWB: kosten elektrische auto, benzine en hybride (tarieven 2026)", ANWB_VS2],
    ["ANWB persbericht 5 februari 2026: laadkosten per gemeente in 2025", ANWB_PERS],
    ["ANWB: wat kost elektrisch laden (snelladen € 0,65 tot € 0,90)", ANWB_LAAD],
    ["ANWB zakelijk: fiscale regels elektrisch rijden 2026 (bijtelling, wegenbelasting)", ANWB_FISC],
    ["RVO: financiële ondersteuning elektrisch vervoer (korting wegenbelasting)", RVO],
    ["RVO: financiële ondersteuning elektrisch rijden (normaal tarief vanaf 2030)", RVO2],
    ["Ayvens: elektrisch leasen in 2026 (bpm € 687)", AYVENS],
    ["AutoScout24: elektrische auto in 2026 (einde SEPP)", AS24],
    ["MKB Servicedesk: regelingen voor elektrisch rijden in 2026 (lokale subsidies)", MKB],
    ["EVKX: ranglijsten elektrische auto's Nederland (vanafprijzen)", EVKX],
    ["Autoreview: de 5 goedkoopste elektrische auto's (private lease)", AUTOREVIEW]
  ],
  verder: [["Laadpaal kiezen", "/laadpaal"], ["Energie vergelijken", "/energieleverancier-vergelijken"]],
  reken: {
    id: "laden", kop: "Wat kost laden per maand?", fn: laadKosten,
    tekst: "Vul in hoeveel je rijdt, wat de auto verbruikt en wat je per kWh betaalt.",
    velden: [["k", "Kilometers per maand", 1250, 50, 10000, 10], ["v", "Verbruik (kWh per 100 km)", 17, 8, 40, 0.1], ["p", "Prijs per kWh (€)", 0.29, 0.05, 2, 0.01]],
    tabel: { kop: "Laadkosten per maand bij 17 kWh per 100 km", kol: ["Kilometers per jaar", "Thuis, € 0,29", "Openbaar, € 0,47", "Snelladen, € 0,73"], rijen: [10000, 15000, 20000].map(j => [j.toLocaleString("nl-NL") + " km", { k: Math.round(j / 12), v: 17, p: 0.29 }, { k: Math.round(j / 12), v: 17, p: 0.47 }, { k: Math.round(j / 12), v: 17, p: 0.73 }]) },
    chat: {
      wat: "laden", tot: 3, voortg: "{n} van {t} klaar", ph: "Of typ je vraag over elektrisch rijden",
      st: [
        { f: "k", v: "Hoeveel kilometer rijd je per jaar?", p: [["10.000 km", "833"], ["15.000 km", "1250"], ["20.000 km", "1667"]], ander: { l: "Ander aantal per maand", ph: "Bijvoorbeeld 1000", min: 50, max: 10000, na: " km per maand" } },
        { f: "p", v: "Waar laad je meestal?", p: [["Thuis, € 0,29 per kWh", "0.29"], ["Openbare laadpaal, € 0,47", "0.47"], ["Snellader, € 0,73", "0.73"]], ander: { l: "Ander tarief", ph: "Bijvoorbeeld 0.35", voor: "€ ", min: 0.05, max: 2 } },
        { f: "v", v: "Hoe zuinig is de auto?", p: [["Kleine auto, 15 kWh per 100 km", "15"], ["Gemiddeld, 17 kWh", "17"], ["Grote auto, 20 kWh", "20"]] }
      ],
      na: [{ l: "Laadpaal kiezen", s: "link", href: "/laadpaal" }, { l: "Alles zelf invullen", s: "zelf" }]
    }
  }
};

export const DIENSTGIDSEN2 = { "iphone-18": IPHONE, "elektrische-auto": EV };
