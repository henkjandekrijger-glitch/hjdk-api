// Idee: minder pagina's, betere gidsen (taak wjvssw, 27 nov 2026, Henkjan: "voer alles door"). Alleen een voorstel op de beschermde host
// (/api/gids?op=gidsidee); niets hiervan staat live voor bezoekers of Google, tot Henkjans ja. Zie OVERDRACHT-KADOLY-GIDS.md.
// Prijzen en namen komen live uit de shopcatalogus; de lijst hieronder bevat alleen product-id's en een label.
import { GIDSEN } from './gidsen-kadoly.js';

export const AFGEVALLEN = [
  ['Cadeau voor vader onder 50 euro', 'Dubbel met "kerstcadeau voor hem": dezelfde whiskysets, scheerset en bureauspullen. Eén pagina is sterker dan twee.'],
  ['Kerstcadeau voor kinderen onder 25 euro', 'Er is nauwelijks speelgoed (2 producten) en geen leeftijdsadvies per product: alleen kinderkamerdecoratie en sokken. Geen eerlijk antwoord.'],
  ['Cadeau voor kattenliefhebbers of hondenliefhebbers', 'Het aanbod is 6 tuinbeelden en wandborden van Rostikal. Dat is decoratie, geen cadeaugids voor dierenliefhebbers.'],
  ['Cadeau voor whiskyliefhebbers onder 50 euro', 'Bestaat al als gids: whisky-set-cadeau.'],
  ['Kraamcadeau en babycadeau', 'Bestaat al als binnenkort-pagina (kraamcadeau-met-naam); het baby-aanbod is kinderkamerposters.'],
  ['Cadeau onder 10 euro', 'Alleen gebruiksspullen (loofah, zeep, broodzak); geen cadeau dat je zonder schaamte geeft.'],
  ['Cadeau voor hem: gadgets of tech onder 50 euro', 'Het techaanbod (laders, speakers) is boven 50 euro of zonder gecontroleerde feiten.'],
];

// per gids: slug, titel (de zoekvraag), voor wie, prijsplafond (euro, inclusief verzending), producten [pid, label], overlap met bestaande gidsen, bron van de productfeiten
// bron 'gids': product staat al in een bestaande gids met gecontroleerde feiten (waarom, beperking); 'shoprij': alleen de shoprij, feiten nog ophalen met op=feiten voor bouwen.
export const IDEE = [
  {"slug":"kerstcadeau-voor-hem-onder-50","titel":"Kerstcadeau voor hem onder 50 euro","wie":"Hem: partner, vader, broer of collega","max":50,"producten":[["oc_4174004620263425","Om te proeven"],["oc_4174004900626435","Compleet, karaf met glazen"],["oc_4173959359135745","Voor wie scheert"],["oc_4173957637144577","Voor op zijn bureau"],["oc_4173957639913473","Klein cadeau"]],"overlap":"kerstcadeau, cadeau-voor-hem, whisky-set-cadeau","bron":"gids"},
  {"slug":"kerstcadeau-voor-haar-onder-25","titel":"Kerstcadeau voor haar onder 25 euro","wie":"Haar: partner, vriendin, zus of collega","max":25,"producten":[["oc_4173959373897729","Verwennen thuis"],["oc_4174002223988737","Voor de handen"],["oc_4173959375896577","Badset"],["oc_4174004663975937","Sfeer"],["oc_4173959369080833","Warm, klein"]],"overlap":"kerstcadeau-voor-haar, badset-cadeau, schoencadeautjes-sinterklaas","bron":"gids"},
  {"slug":"kerstcadeau-voor-haar-onder-50","titel":"Kerstcadeau voor haar onder 50 euro","wie":"Haar, een echt cadeau","max":50,"producten":[["oc_4173959376158721","Verwennen"],["oc_4174004744241153","Geur en sfeer"],["oc_4173958872186881","Iets levends"],["oc_4173958880296961","Voor de salontafel"],["oc_4174005828042753","Kaarsen om te geven"]],"overlap":"kerstcadeau-voor-haar, cadeau-voor-haar","bron":"gids"},
  {"slug":"kerstcadeau-collega-onder-20","titel":"Kerstcadeau voor collega onder 20 euro (Secret Santa)","wie":"Collega of lootjes trekken, neutraal","max":20,"producten":[["oc_4174002222628865","Handen"],["oc_4173958827622401","Pot voor een plant"],["oc_4174002206703618","Op het bureau"],["oc_4173959388299265","Warme sokken"],["oc_4174004663975937","Geurkaars"]],"overlap":"afscheidscadeau-collega","bron":"gids"},
  {"slug":"kerstcadeau-collega-onder-25","titel":"Kerstcadeau voor collega onder 25 euro","wie":"Collega of buren, iets meer budget","max":25,"producten":[["oc_4174003425230849","Voor in huis"],["oc_4174003378864129","Plant zonder zorg"],["oc_4174003429965826","Op de bank"],["oc_4173959363641346","Basis, onder 10"]],"overlap":"afscheidscadeau-collega","bron":"gids"},
  {"slug":"cadeau-onder-15-euro","titel":"Kerstcadeau onder 15 euro","wie":"Klein gebaar, school, buren of schoen","max":15,"producten":[["oc_4173959362314241","Scrubber"],["oc_4173959358431233","Portemonnee"],["oc_4173959354744833","Scheerolie"],["oc_4173959362543617","Scheerkwast"],["oc_4173959355039745","Scheermes"]],"overlap":"schoencadeautjes-sinterklaas","bron":"gids"},
  {"slug":"cadeau-moeder-onder-30","titel":"Cadeau voor moeder onder 30 euro","wie":"Moeder die alles heeft","max":30,"producten":[["oc_4173959375896577","Badset"],["oc_4173959376158721","Badset XL"],["oc_4174003429965826","Plaid"],["oc_4173959369080833","Sokken"],["oc_4174004663975937","Kaars"]],"overlap":"cadeau-voor-moeder","bron":"gids"},
  {"slug":"cadeau-oma-onder-30","titel":"Cadeau voor oma onder 30 euro","wie":"Oma, warm en handig","max":30,"producten":[["oc_4174003429965826","Plaid"],["oc_4173959388299265","Alpacasokken"],["oc_4174002223988737","Handverzorging"],["oc_4174004663975937","Kaars"],["oc_4173958827622401","Pot"]],"overlap":"cadeau-voor-moeder","bron":"gids"},
  {"slug":"cadeau-gastvrouw-onder-40","titel":"Cadeau voor de gastvrouw onder 40 euro","wie":"Kerstdiner of visite","max":40,"producten":[["oc_4173958872186881","Levend"],["oc_4174003425230849","Lantaarn"],["oc_4174004744241153","Kaars"],["oc_4174002164744193","Tafelhaard"],["oc_4174004663975937","Klein"]],"overlap":"housewarming-cadeau, orchidee-cadeau","bron":"gids"},
  {"slug":"cadeau-koffie-thee-onder-30","titel":"Cadeau voor koffie- en theeliefhebbers onder 30 euro","wie":"Wie elke dag koffie of thee drinkt","max":30,"producten":[["oc_4174004745666561","Mok"],["oc_4174004741521410","Espressomok"],["oc_4174004676165633","Theedoos"],["oc_4174004749008899","Koffielepels"]],"overlap":"geen (servies bestaat apart)","bron":"shoprij"},
  {"slug":"cadeau-plantenliefhebber-onder-40","titel":"Cadeau voor plantenliefhebbers onder 40 euro","wie":"Wie al planten heeft","max":40,"producten":[["oc_4173958872186881","Plant"],["oc_4173958901841921","Sierpot"],["oc_4173958838910977","Sierpot goud"],["oc_4174003462815745","Bloempot"],["oc_4174003434799105","Bloempot metaal"]],"overlap":"orchidee-cadeau, sierpot-orchidee","bron":"gids"},
  {"slug":"cadeau-sfeer-kaarsen-onder-35","titel":"Cadeau voor wie van sfeer houdt onder 35 euro","wie":"Kaarsen en licht","max":35,"producten":[["oc_4174004663975937","Vanille"],["oc_4174005828042753","Dip dye"],["oc_4174004745093121","EDDA"],["oc_4174003425230849","Lantaarn"],["oc_4174003366658049","Lantaarn Pietra"]],"overlap":"kaarsen-cadeau (hoog)","bron":"gids"},
  {"slug":"cadeau-thuiswerker-onder-50","titel":"Cadeau voor wie thuis werkt onder 50 euro","wie":"Bureau, thuiswerker","max":50,"producten":[["oc_4173957639913473","Penhouder"],["oc_4173957640323073","Set"],["oc_4173957637144577","Bak"],["oc_4174002206703618","Pot"]],"overlap":"houten-bureau-accessoires (hoog)","bron":"gids"},
  {"slug":"kerstcadeau-voor-in-huis-onder-30","titel":"Kerstcadeau voor in huis onder 30 euro","wie":"Gezin of huisgenoten","max":30,"producten":[["oc_4174003395198977","Kerstballen"],["oc_4174003439681537","Boompje"],["oc_4174003567198209","Kroontjes"],["oc_4174003400785923","Krans"],["oc_4174002179178498","Discobal"]],"overlap":"kerstballen-set, kerstkrans, kerstdecoratie (hoog)","bron":"gids"},
  {"slug":"cadeau-gezellige-avond-onder-40","titel":"Cadeau voor een gezellige avond thuis onder 40 euro","wie":"Bank, kaars en iets te drinken","max":40,"producten":[["oc_4174003429965826","Plaid"],["oc_4174003425230849","Lantaarn"],["oc_4174004745093121","Kaars"],["oc_4174002164744193","Tafelhaard"],["oc_4174004900626435","Karaf en glazen"]],"overlap":"kaarsen-cadeau, wollen-deken","bron":"gids"},
  {"slug":"cadeau-tiener-onder-30","titel":"Cadeau voor een tiener onder 30 euro","wie":"Tiener of jong volwassene, accessoires","max":30,"producten":[["oc_4174005868838913","Haarspeld"],["oc_4174005921972225","Sleutelhanger"],["oc_4174005859680257","XL haarspeld"],["oc_4174005936226305","Haarspeld konijn"]],"overlap":"geen","bron":"shoprij"},
  {"slug":"armband-cadeau-onder-25","titel":"Armband cadeau onder 25 euro","wie":"Voor haar, boho","max":25,"producten":[["oc_4254790007914497","Believe"],["oc_4254790022676481","Blessed"],["oc_4254790015090689","Vitamin Sea"],["oc_4254790040338433","Goldschatz"],["oc_4254790027329537","Good Vibes Only"]],"overlap":"geen","bron":"shoprij"},
  {"slug":"oorbellen-cadeau-onder-50","titel":"Oorbellen cadeau onder 50 euro","wie":"Voor haar, zilver","max":50,"producten":[["oc_4251973657444353","Driehoek"],["oc_4251973286576129","Bar"],["oc_4251973846581249","Cirkel"],["oc_4174005817786369","Klein"],["oc_4254789951029249","Ster"]],"overlap":"geen","bron":"shoprij"},
  {"slug":"ketting-cadeau-onder-45","titel":"Ketting cadeau onder 45 euro","wie":"Voor haar, verguld","max":45,"producten":[["oc_4254789972738049","Parel"],["oc_4254790034735105","Parelbloem"],["oc_4254789972475905","Parelketting"],["oc_4254790068961281","Rope"],["oc_4256811652186113","Slangenketting"]],"overlap":"geen","bron":"shoprij"},
  {"slug":"cadeau-beste-vriendin-onder-25","titel":"Cadeau voor je beste vriendin onder 25 euro","wie":"Beste vriendin","max":25,"producten":[["oc_4174005845557249","BFF"],["oc_4174005850128386","Better Half"],["oc_4174005845344257","Happily Ever After"],["oc_4174005845901313","Gin to My Tonic"]],"overlap":"geen","bron":"shoprij"}
];

// Voorbeeldgids: "kerstcadeau voor hem onder 50 euro", in het formaat van lib/gidsen-kadoly.js. De feiten (waarom, beperking) komen uit de
// bestaande, gecontroleerde gidsen (zelfde werkwijze als cadeauTips in lib/gidsen-cadeautips.js); alleen label, kop en tekst eromheen zijn nieuw.
// Een product boven het plafond of niet leverbaar valt vanzelf weg.
export const VOORBEELD_SLUG = 'kerstcadeau-voor-hem-onder-50';
export function voorbeeldGids(cat, thuis) {
  const d = IDEE.find(x => x.slug === VOORBEELD_SLUG); const keuze = []; const gezien = new Set();
  for (const [pid, label] of d.producten) {
    const i = cat && cat[pid]; if (!i || i.vr === false || thuis(i) > d.max || gezien.has(pid)) continue;
    let k = null; for (const g of Object.values(GIDSEN)) { k = (g.keuze || []).find(x => x.pid === pid); if (k) break; }
    if (!k) continue; gezien.add(pid); keuze.push({ pid, label, naam: k.naam, waarom: k.waarom, beperking: k.beperking });
  }
  const p = Object.fromEntries(keuze.map(k => [k.label, k.pid]));
  return {
    slug: VOORBEELD_SLUG, bijgewerkt: '2026-11-27', cadeautips: true,
    titel: 'Kerstcadeau voor hem onder 50 euro: 5 tips',
    beschrijving: 'Kerstcadeaus voor hem tot 50 euro, inclusief verzending: whiskyglazen, een scheerset en bureauspullen. Met wat erin zit en voor wie het niet past.',
    kicker: 'Cadeautips · kerst · tot 50 euro',
    h1: 'Kerstcadeau voor hem onder 50 euro: wat past bij hem?',
    kort: 'Drinkt hij graag een whisky, kies de gestreepte set met karaf en vier glazen. Wil je alleen proeven, kies de zes mini glaasjes. Scheert hij met de hand, kies de scheerset met bamboe scheermes, olie en doekje. Werkt hij thuis, kies de houten verzamelbak voor sleutels en telefoon of de Japanse penhouder. Elk product hieronder kost met verzending hooguit 50 euro; de actuele prijs staat bij elk product.',
    keuze,
    tabelKop: 'Welk cadeau past bij hem?',
    tabel: [
      { situatie: 'Hij drinkt graag whisky en je wilt een compleet cadeau', advies: 'De gestreepte set met karaf en vier glazen.', pid: p['Compleet, karaf met glazen'] || '' },
      { situatie: 'Hij wil verschillende whisky\'s naast elkaar proeven', advies: 'De zes mini glaasjes.', pid: p['Om te proeven'] || '' },
      { situatie: 'Hij scheert met de hand', advies: 'De scheerset met bamboe scheermes, 10 mesjes, scheerolie en doekje.', pid: p['Voor wie scheert'] || '' },
      { situatie: 'Hij werkt thuis en zijn bureau is rommelig', advies: 'De houten verzamelbak voor sleutels, portemonnee en telefoon.', pid: p['Voor op zijn bureau'] || '' },
      { situatie: 'Klein budget, wel iets van hout', advies: 'De Japanse houten penhouder.', pid: p['Klein cadeau'] || '' },
      { situatie: 'Hij drinkt geen alcohol of scheert elektrisch', advies: 'Sla de whiskyglazen en de scheerset over en kies de bureauspullen.', pid: '' },
    ].filter((r, i, a) => r.pid || i === a.length - 1),
    uitleg: [
      { kop: 'Hoe kies je een kerstcadeau voor hem?', alineas: [
        'Kijk naar wat hij elke week doet. Drinkt hij een glas whisky, scheert hij met de hand of werkt hij thuis? Kies iets waar hij het hele jaar iets aan heeft.',
        'Alle prijzen op deze pagina zijn inclusief btw en verzending volgens het huidige shopbeleid. Controleer vóór betaling de kosten en de bezorgschatting voor jouw adres.',
      ] },
      { kop: 'Wat we niet weten', alineas: [
        'We hebben de producten niet zelf vastgehad. Alles hierboven rust op wat de maker opgeeft, en bij elk product staat wat de maker niet vermeldt. Bij de whiskysets en de verzamelbak ontbreken maten of inhoud in de tekst.',
      ] },
    ],
    zoKozenWe: 'We zochten in onze winkel naar cadeaus voor hem tot 50 euro inclusief verzending en namen alleen producten waarvan de feiten al in een van onze eigen gidsen staan: de whisky-gids, de scheerset-gids en de bureau-gids. De prijs komt live uit de winkel. Kadoly verdient aan elke verkoop; dat verandert niets aan wat we als beperking noemen.',
    faq: [
      { v: 'Wat is een goed kerstcadeau voor hem onder 50 euro?', a: 'Voor een whiskydrinker de gestreepte set met karaf en vier glazen. Voor wie met de hand scheert de scheerset met bamboe scheermes, olie en doekje. Voor wie thuis werkt de houten verzamelbak.' },
      { v: 'Wat geef ik een man die alles heeft?', a: 'Iets wat hij gebruikt en opmaakt of opruimt: een scheerset, een houten bak voor sleutels en telefoon of glazen om whisky mee te proeven.' },
      { v: 'Zit de verzending in de prijs?', a: 'Ja, volgens het huidige shopbeleid zit de verzending in de getoonde prijs. Controleer kosten en bezorgschatting voor jouw adres vóór betaling.' },
      { v: 'Is de whiskyset geschikt voor de vaatwasser?', a: 'De zes mini glaasjes volgens de maker wel. De set met karaf en glazen niet: handwas.' },
      { v: 'Wanneer heb ik het in huis voor kerst?', a: 'Bij elk product staat de verwachte bezorgdag als je vandaag bestelt. Dat is een schatting, geen garantie.' },
    ],
  };
}

// De ideepagina zelf (alleen op de beschermde host). ctx: { cat, thuis, euro, esc, lever, stats }
export function ideeHtml(ctx) {
  const { cat, thuis, euro, esc, lever, stats: s } = ctx; const A = x => esc(String(x));
  let weg = 0, tot = 0;
  const blok = IDEE.map((d, n) => {
    const rijen = d.producten.map(([pid, label]) => { const i = cat[pid]; tot++;
      if (!i || i.vr === false) { weg++; return `<li>${A(label)}: niet meer leverbaar, valt weg</li>`; }
      const pr = thuis(i); const ok = pr <= d.max;
      return `<li><b>${A(label)}</b>: ${A(i.t)}${i.b ? ' (' + A(i.b) + ')' : ''}, ${euro(pr)} inclusief verzending${ok ? '' : ' (nu boven ' + d.max + ' euro, valt weg)'}${lever ? ', ' + A(lever(i)) : ''}</li>`; }).join('');
    const aantal = d.producten.filter(([pid]) => cat[pid] && cat[pid].vr !== false && thuis(cat[pid]) <= d.max).length;
    return `<section class="si-sec"><h3>${n + 1}. ${A(d.titel)}</h3><p>Voor wie: ${A(d.wie)}. Plafond: ${d.max} euro inclusief verzending. Pagina: /${A(d.slug)}. Producten nu: ${aantal} (${d.bron === 'gids' ? 'feiten al gecontroleerd in een bestaande gids' : 'alleen de shoprij; feiten eerst ophalen met op=feiten'}).</p><ul class="si-punt">${rijen}</ul><p>Overlap met bestaande gidsen: ${A(d.overlap)}.</p></section>`; }).join('');
  const voor = s.voorbeelden.map(v => `<li>${A(v.t)}: https://kadoly.com/product/${A(v.id)}</li>`).join('');
  return `<p class="kicker">Voorstel voor Henkjan · alleen te zien op deze beschermde pagina</p><h1>Minder pagina's, betere gidsen</h1>
<p class="standfirst">Kadoly gidsen, 27 november 2026. Dit is een voorstel. Er is niets gewijzigd aan wat bezoekers of Google zien op gids.kadoly.com of kadoly.com. Pas na jouw ja gaat er iets live.</p>
<div class="answer lead"><p><strong>Het voorstel in drie zinnen.</strong> 1. De dunne productpagina's zonder eigen inhoud gaan op noindex en uit de sitemap, zodat Google zijn aandacht houdt voor pagina's die iets uitleggen. 2. Er komen 20 cadeaugidsen voor de feestdagen met echte producten, een prijsplafond en gewone taal. 3. Eén gids is hieronder al helemaal uitgewerkt, zodat je de exacte pagina ziet voordat je ja zegt.</p><p><a class="btn knop" href="/api/gids?op=gidsidee&amp;voorbeeld=1">Bekijk de voorbeeldgids: kerstcadeau voor hem onder 50 euro</a></p></div>

<h2>Eerst wat ik vond: de dunne pagina's staan niet op gids.kadoly.com</h2>
<ul class="si-punt">
<li>De sitemap van gids.kadoly.com telt nu ${s.sitemapGids} adressen: gidsen, rubrieken, redactie en hulpmiddelen. Er is op die site geen pagina per product. Het overzicht /alle-producten is één pagina met ${s.rijen} rijen.</li>
<li>De ongeveer 2.144 dunne pagina's zijn de productpagina's op kadoly.com/product/... (de winkel zelf). Dat zijn winkelpagina's uit de winkelcode, die buiten deze repo valt. De sitemap van de winkel (kadoly.com/sitemap/shop-1.xml en shop-2.xml) zet elk product viermaal neer: zonder taalkeuze en met ?lang=nl, ?lang=es en ?lang=de. Het eerste bestand is 17,4 MB. Dat wijst op tienduizenden adressen; ik heb ze niet geteld.</li>
<li>Wat ik in deze repo wel kan sturen: de lijst van ${s.rijen} producten in de gegevens van /alle-producten (ItemList) die Google naar al die productpagina's wijst, en de gidsen zelf. De noindex op de productpagina's moet in de winkelcode gebeuren.</li>
</ul>

<h2>Deel 1: welke pagina's op noindex</h2>
<p><b>De regel:</b> een productpagina krijgt noindex en gaat uit de sitemap als het product (a) geen externe koopcheck heeft en (b) in geen enkele gids staat. Krijgt het later wel een koopcheck, een plek in een gids of een eigen tekst in de winkel (winkelcontent), dan gaat de pagina vanzelf terug naar index. De talenvarianten met ?lang= blijven bereikbaar maar krijgen canonical naar de hoofdpagina en staan niet meer in de sitemap.</p>
<ul class="si-punt">
<li>Producten in de catalogus nu: ${s.rijen}. Met koopcheck: ${s.metKoopcheck}. Zonder koopcheck: ${s.zonderKoopcheck}.</li>
<li>Daarvan staan ${s.inGidsZonderCheck} in een gids. De regel raakt dus nu <b>${s.zonder}</b> productpagina's (zonder koopcheck en zonder gids). Dat is het echte getal van vandaag; de overdracht noemde 2.144 op 26 november, de catalogus is intussen iets gekrompen.</li>
<li>Blijft in de index: alle gidsen, rubrieken, redactie, hulpmiddelen, en de ${s.metKoopcheck} producten met koopcheck plus de producten die in een gids staan.</li>
<li>Sitemap van gids.kadoly.com: ${s.sitemapGids} adressen nu. De noindex verandert dat niet, want er staan geen productpagina's in. Het effect zit in de sitemap van de winkel; het aantal daar na de ingreep is: alleen de producten die in de index blijven, in één taal.</li>
</ul>
<p><b>Tien voorbeelden van pagina's die op noindex gaan:</b></p><ul class="si-punt">${voor}</ul>
<p><b>Waarop het besluit rust.</b> Uit de overdracht van 26 november: 3.329 unieke producten, 1.185 met koopcheck, 2.144 zonder. Search Console voor gids.kadoly.com, 5 tot 23 november: 11 vertoningen en 0 klikken; inspectie 26 november: 6 van 83 adressen in de index. Dit zijn cijfers uit de overdracht, niet vandaag opnieuw gelezen. Search Console voor de winkelpagina's heb ik niet kunnen lezen, dus ik weet niet hoeveel klikken die 2.144 pagina's nu geven. Dat getal hoort bij het besluit van 28 november.</p>
<p><b>Risico.</b> Verkopen via Google Shopping en directe zoekopdrachten naar een productnaam kunnen op deze pagina's binnenkomen. De winkel heeft nog geen 15 bevestigde organische aankopen per 7 dagen (doel 20 december), dus er valt weinig te verliezen, maar het is niet nul. Noindex haalt een pagina niet offline: kopen via een link, advertentie of Google Shopping blijft werken. Google Shopping hoort noindex-pagina's te accepteren zolang de pagina bereikbaar is; dat moet de winkelchat controleren voordat de ingreep live gaat.</p>
<p><b>Terugdraaien.</b> Eén schakelaar in de winkelcode (en in de gidscode voor de ItemList): uit zetten en de sitemap bouwt zich bij de volgende ronde opnieuw met alle producten. IndexNow meldt de wijziging, dus herstel kost enkele dagen tot weken in Google, niet minuten. Daarom: eerst een proefgroep van 200 pagina's, dan pas alles.</p>

<h2>Deel 2: 20 cadeaugidsen voor de feestdagen</h2>
<p>De prijzen en namen hieronder komen op dit moment live uit de shopcatalogus (prijs inclusief btw en verzending volgens het shopbeleid van 18 november; uitzonderingen per land of product controleer ik niet). ${tot - weg} van ${tot} producten zijn nu leverbaar en onder het plafond. Ik heb geen zoekvolumes verzonnen: Demand Radar heeft voor deze exacte zinnen met prijsplafond geen cijfers. Wel zijn de brede zoektermen bekend: cadeautips voor hem 13.558 per maand, cadeautips voor haar 13.058, cadeautips mannen 14.075, kerstcadeautips 5.873 (NL en BE, gemiddeld over 12 maanden). Die geven de richting, niet het volume van elke gids.</p>
<p>Bestaande gidsen die ik niet dubbel bouw: kerstcadeau, kerstcadeau-voor-haar, cadeau-voor-haar, cadeau-voor-hem, cadeau-voor-moeder, housewarming-cadeau, afscheidscadeau-collega, schoencadeautjes-sinterklaas, kaarsen-cadeau, whisky-set-cadeau, scheerset-cadeau. De nieuwe gidsen verschillen door het prijsplafond en de doelgroep. Toch overlappen sommige sterk; daarom staat per gids de overlap erbij en bouwen we eerst de gidsen met de minste overlap.</p>
${blok}
<h2>Wat afviel en waarom</h2><ul class="si-punt">${AFGEVALLEN.map(([t, r]) => `<li><b>${A(t)}</b>: ${A(r)}</li>`).join('')}</ul>

<h2>Voorbeeldgids</h2>
<p>De pagina van gids 1 is helemaal uitgewerkt met dezelfde opbouw en look als de bestaande gidsen: kort antwoord, onze keuze, tabel per situatie, uitleg, zo kozen we, vragen en de gegevens voor Google (Article, BreadcrumbList, ItemList met Product en Offer, FAQPage). Staat op dezelfde beschermde host, noindex, niet in de sitemap en nergens aan gelinkt. De knoppen in het voorbeeld lopen via /naar/ en tellen mee als klik op de naam van deze gids als je erop tikt.</p>
<p><a class="btn knop" href="/api/gids?op=gidsidee&amp;voorbeeld=1">Open de voorbeeldgids</a></p>

<h2>Volgorde en planning na jouw ja</h2>
<ul class="si-punt">
<li><b>Dag 1:</b> de winkelchat krijgt de opdracht voor de noindex-schakelaar (uit) en een proefgroep van 200 productpagina's. Ik bouw gids 1 tot en met 5 (de minste overlap: hem 50, haar 25, haar 50, collega 20, onder 15) en haal bij elk product de feiten op met op=feiten.</li>
<li><b>Dag 2 tot 5:</b> vijf gidsen per dag, nooit meer, elk met ZICHT-proef en JSON-LD; na elke ronde IndexNow voor alleen de gewijzigde pagina's. Gids 6 tot 20 volgen in dezelfde volgorde van weinig naar veel overlap.</li>
<li><b>Dag 5:</b> eerste oordeel op de proefgroep: gelijk of beter dan de controlegroep in vertoningen en klikken, dan alle pagina's uit de regel. Anders terug via de schakelaar.</li>
<li><b>Meting per gids:</b> weergaven, klikken naar de shop (blok en product), bevestigde organische aankopen via Clickmind. De gidsen met 100 weergaven en nul klikken krijgen een nieuwe kop of vervallen. Het getal waarop dit oordeelt is bevestigde organische aankopen per 7 dagen (doel 15 op 20 december).</li>
<li>Voor kerst bestellen kan tot half december (de bestaande gidsen noemen 16 of 17 december); dus de gidsen moeten in de eerste week van december online zijn om nog iets te doen voor kerst. Sinterklaas (5 december) halen we niet meer met nieuwe gidsen, behalve gids 1 tot 5 als ze binnen twee dagen in Google staan, wat niet te beloven is.</li>
</ul>

<h2>Wat ik niet kon verifiëren</h2>
<ul class="si-punt">
<li>Hoeveel adressen de winkelsitemap precies heeft en wat Google er nu van indexeert.</li>
<li>Of de verzending in de prijs voor elk land en elk product klopt: ik gebruik de kolom Prijs incl. verzending van /alle-producten.</li>
<li>De feiten van producten die in geen bestaande gids staan (${IDEE.filter(d => d.bron !== 'gids').length} van de 20 gidsen): die moeten bij het bouwen eerst via op=feiten gecontroleerd worden.</li>
<li>Of Google Shopping noindex-productpagina's blijft tonen.</li>
</ul>
<p><b>Jouw antwoord:</b> ja op noindex voor de pagina's zonder koopcheck en zonder gids (eerst proefgroep van 200) en ja op de 20 cadeaugidsen.</p>`;
}
