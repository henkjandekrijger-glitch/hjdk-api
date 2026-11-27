// AI-gaten voor cadeauvragen (taak o9w904, 27 nov 2026, Henkjan: "Kadoly AI-gaten: kies 5 cadeauvragen ... waar AI geen goed antwoord geeft;
// maak die vraag de eerste FAQ en de opening van de bijbehorende gids ... Eerst tonen aan Henkjan").
// STAAT UIT. De schakelaar is de kv-vlag gk:llmgat:aan (zet alleen via /api/gids?op=llmgatzet&aan=1 op de beschermde host, na Henkjans ja).
// Uit: elke gids is byte voor byte gelijk aan hoe hij was. Aan: de vraag staat als eerste FAQ en de gids opent met een eerste keus.
// Prijzen staan niet in de tekst maar als {p:<product-id>} en komen bij elk bezoek live uit de shopcatalogus (inclusief btw en verzending).
// Valt een genoemd product weg (niet leverbaar of niet meer aanbevolen), dan blijft die gids ongewijzigd: nooit een opening met een product dat er niet is.
// Bewijs van het gat: Demand Radar (api/gaps?latest=1, laatste dag 20 nov 2026) heeft geen enkele cadeauvraag; daarom zelf gemeten
// (Claude Sonnet, geen webzoeken, de vraag zoals iemand hem aan een AI stelt, antwoord in 60 tot 90 woorden), 27 nov 2026, één antwoord per vraag.

export const GEMETEN_DAG = '2026-11-27';
export const GEMETEN_DOOR = 'Claude (Sonnet), zonder webzoeken, eigen tokens, niet de AI Gateway; één antwoord per vraag';
export const VLAG = 'gk:llmgat:aan';

export const GATEN = [
  {
    slug: 'kerstcadeau-voor-haar',
    vraag: 'Welk kerstcadeau geef ik een vrouw die alles al heeft?',
    vervangt: ['Wat geef je een vrouw die alles al heeft met kerst?'],
    meting: {
      level: 'open', bron: 'zelf gemeten',
      antwoord: 'Kies iets dat ze niet zelf zou kopen maar wel gebruikt: een geurkaars of verzorgingsset van merken als Rituals of Jo Malone, een zachte plaid, een spa- of massagebon, een bloemenabonnement of een persoonlijk fotoboek. Heeft ze een hobby, dan past een cursus of workshop. Let op budget en bezorgtermijn rond de feestdagen; bij bol.com, de Bijenkorf of Etsy vind je veel opties.',
      genoemd: ['Rituals', 'Jo Malone', 'bol.com', 'de Bijenkorf', 'Etsy'], eersteKeus: false,
    },
    opening: 'Heeft ze al alles, kies dan iets dat opraakt of leeft. Onze eerste keus is de badset Den en Winterbessen van green-goose ({p:oc_4173959373897729}): badolie, lotion, een geurkaars, een spiegeltje en een massagestick in een houten doos. Iets levends is de plantenset met orchidee en vetplant ({p:oc_4173958884671489}). Iets kleins: de dames alpacasokken met rendier, 2 paar ({p:oc_4173959369080833}). Prijzen zijn inclusief btw en verzending. Heeft ze een gevoelige huid, vraag dan eerst wat ze verdraagt.',
    antwoord: 'Iets dat opraakt of leeft. Onze eerste keus is de badset Den en Winterbessen van green-goose ({p:oc_4173959373897729}, inclusief verzending): badolie, lotion, een geurkaars, een spiegeltje en een massagestick in een houten doos. Iets levends: de plantenset met orchidee en vetplant ({p:oc_4173958884671489}). Heeft ze een gevoelige huid, vraag dan eerst wat ze verdraagt. Controleer de bezorgdag per product vóór betaling.',
  },
  {
    slug: 'schoencadeautjes-sinterklaas',
    vraag: 'Wat kan ik in de schoen doen voor Sinterklaas?',
    vervangt: ['Wat is een goed schoencadeautje voor Sinterklaas?'],
    meting: {
      level: 'generic', bron: 'zelf gemeten',
      antwoord: 'Populaire schoencadeautjes zijn chocoladeletters, pepernoten, marsepein, kleine knuffels, stickers, een boekje, kleurpotloden, mutsen of sokken en een kleinigheid die bij de interesse past. Winkels als HEMA, Action, Blokker en bol.com hebben speciale Sinterklaasartikelen. Houd het klein en let op allergieën. Voor volwassenen werkt een persoonlijk gedichtje met een kleine attentie.',
      genoemd: ['HEMA', 'Action', 'Blokker', 'bol.com'], eersteKeus: false,
    },
    opening: 'In de schoen hoort iets kleins dat je echt gebruikt. Bij Kadoly geen snoep of chocoladeletters. Voor een kind: de kinder alpacasokken, 5 paar ({p:oc_4173959376683009}); controleer eerst de maat bij de maker. Voor een volwassene die zich scheert: natuurlijke scheerolie, 30 ml ({p:oc_4173959354744833}). Voor haar: dames alpacasokken met rendier, 2 paar ({p:oc_4173959369080833}). Prijzen zijn inclusief btw en verzending. Pakjesavond is zaterdag 5 december 2026: controleer per product de bezorgschatting vóór betaling, er is geen bezorggarantie.',
    antwoord: 'Iets kleins dat je gebruikt. Voor een kind de kinder alpacasokken, 5 paar ({p:oc_4173959376683009}, inclusief verzending), als de maat past. Voor een volwassene die zich scheert de natuurlijke scheerolie van 30 ml ({p:oc_4173959354744833}). Kadoly verkoopt geen snoep, chocoladeletters of adventskalenders. Pakjesavond is zaterdag 5 december 2026; controleer de bezorgschatting per product vóór betaling, er is geen bezorggarantie.',
  },
  {
    slug: 'housewarming-cadeau',
    vraag: 'Wat geef je als housewarming cadeau als je de smaak van de ander niet kent?',
    vervangt: ['Wat geef je als je de inrichting niet kent?'],
    meting: {
      level: 'unclear', bron: 'zelf gemeten',
      antwoord: 'Veilige keuzes zijn een plant, een geurkaars, een mooie fles wijn of een kruidenset, een cadeaubon voor een lokale winkel of restaurant, of een schaal om sleutels in te leggen. Liever iets kleins dat opraakt dan een decoratief object waarvan je de smaak niet kent. Een bon van bijvoorbeeld bol.com of IKEA werkt ook. Voeg een persoonlijk kaartje toe.',
      genoemd: ['bol.com', 'IKEA'], eersteKeus: false,
    },
    opening: 'Ken je de smaak niet, geef dan iets dat opraakt of leeft en geen stijlkeuze vraagt. Onze eerste keus is de plantenset met orchidee en vetplant ({p:oc_4173958884671489}): twee planten in keramieken potten op een schaal, uitpakken en neerzetten. Klein: de witte orchidee en vetplant in één pot ({p:oc_4173958872186881}) of de EDDA geurkaars Aalina, Mountain Air ({p:oc_4174004744241153}). Prijzen zijn inclusief btw en verzending. Een plant heeft wel genoeg licht nodig.',
    antwoord: 'Iets dat opraakt of leeft. Onze eerste keus is de plantenset met orchidee en vetplant ({p:oc_4173958884671489}, inclusief verzending): twee planten in keramieken potten op een schaal. Liever klein? De EDDA geurkaars Aalina, Mountain Air ({p:oc_4174004744241153}). Een plant past alleen als er genoeg licht is. Controleer de bezorgdag per product vóór betaling.',
  },
  {
    slug: 'cadeau-voor-hem',
    vraag: 'Wat geef je een man die alles al heeft?',
    vervangt: ['Wat geef je een man die alles al heeft?'],
    meting: {
      level: 'open', bron: 'zelf gemeten',
      antwoord: 'Een man die alles heeft waardeert vaak een belevenis of iets dat opraakt: een whisky- of bierproeverij, een goede fles, een kookworkshop, een kaartje voor een wedstrijd, een luxe scheerset of goede koffie. Denk aan zijn hobby en kijk bij merken als Nespresso, Weber of Coolblue voor tech. Een gegraveerd persoonlijk item geeft extra waarde.',
      genoemd: ['Nespresso', 'Weber', 'Coolblue'], eersteKeus: false,
    },
    opening: 'Heeft hij alles, kijk dan wat hij elke week doet en geef daar iets beters voor. Scheert hij zich, kies de scheerset met bamboe scheermes, 10 mesjes, scheerolie en doekje ({p:oc_4173959359135745}). Drinkt hij whisky, kies de gestreepte set met karaf en 4 glazen van Aulica ({p:oc_4174004900626435}) of de zes mini glaasjes om te proeven ({p:oc_4174004620263425}). Iets kleins: de natuurlijke scheerolie van 30 ml ({p:oc_4173959354744833}). Prijzen zijn inclusief btw en verzending.',
    antwoord: 'Iets dat bij zijn gewoonte past en opraakt of gebruikt wordt. Scheert hij zich: de scheerset met bamboe scheermes, 10 mesjes, scheerolie en doekje ({p:oc_4173959359135745}, inclusief verzending). Drinkt hij whisky: zes mini glaasjes om te proeven ({p:oc_4174004620263425}) of de set met karaf en 4 glazen van Aulica ({p:oc_4174004900626435}). De karafset gaat volgens de maker niet in de vaatwasser.',
  },
  {
    slug: 'cadeau-voor-moeder',
    vraag: 'Wat geef ik mijn moeder als ze zegt dat ze niets nodig heeft?',
    vervangt: ['Wat geef je een moeder die alles al heeft?'],
    meting: {
      level: 'open', bron: 'zelf gemeten',
      antwoord: 'Voor een moeder die zegt niets nodig te hebben werkt een belevenis of iets dat opraakt: een high tea, een bloemenabonnement, een spadag, mooie badproducten van Rituals of Yves Rocher, een fotoboek met familiefoto\'s of een plant. Maak het persoonlijk en geef tijd samen. Bol.com, Etsy en Fotofabriek bieden veel keuze; kijk naar haar interesses.',
      genoemd: ['Rituals', 'Yves Rocher', 'bol.com', 'Etsy', 'Fotofabriek'], eersteKeus: false,
    },
    opening: 'Zegt ze dat ze niets nodig heeft, geef dan iets dat ze gebruikt maar zelf niet snel koopt. Onze eerste keus is de badset Roos en Argan van green-goose ({p:oc_4173959375896577}): badschuim en een massageborstel in een houten doos. Zit ze vaak koud, kies de merino-kasjmier plaid Milano ({p:oc_4174003728695297}), volgens de maker 90% merinowol en 10% kasjmier. Houdt ze van planten: de witte orchidee en vetplant in één pot ({p:oc_4173958872186881}). Prijzen zijn inclusief btw en verzending.',
    antwoord: 'Iets dat ze gebruikt maar zelf niet snel koopt. Onze eerste keus is de badset Roos en Argan van green-goose ({p:oc_4173959375896577}, inclusief verzending): badschuim en een massageborstel in een houten doos. Zit ze vaak koud: de merino-kasjmier plaid Milano ({p:oc_4174003728695297}). Houdt ze van planten: de witte orchidee en vetplant in één pot ({p:oc_4173958872186881}). Controleer de bezorgdag per product vóór betaling.',
  },
];

const PID = /\{p:([A-Za-z0-9_]+)\}/g;
export const pidsVan = t => [...String(t).matchAll(PID)].map(m => m[1]);

// Zet {p:pid} om naar de live prijs. Geeft null als een genoemd product er niet (meer) is.
export function vul(tekst, cat, thuis, euro, toegestaan) {
  let ok = true;
  const uit = String(tekst).replace(PID, (_, pid) => {
    const i = cat && cat[pid];
    if (!i || i.vr === false || (toegestaan && !toegestaan(i))) { ok = false; return ''; }
    return euro(thuis(i));
  });
  return ok ? uit : null;
}

// De gids met het gat gevuld, of dezelfde gids (zelfde object) als de schakelaar uit staat of een product ontbreekt.
export function toepas(g, ctx) {
  const { aan, cat, thuis, euro, toegestaan } = ctx || {};
  if (!aan || !g) return g;
  const d = GATEN.find(x => x.slug === g.slug); if (!d) return g;
  const opening = vul(d.opening, cat, thuis, euro, toegestaan), antwoord = vul(d.antwoord, cat, thuis, euro, toegestaan);
  if (!opening || !antwoord) return g;
  const weg = new Set(d.vervangt.concat([d.vraag]));
  const faq = [{ v: d.vraag, a: antwoord }].concat((g.faq || []).filter(f => !weg.has(f.v)));
  return Object.assign({}, g, { faq, llmOpening: opening, llmGat: d.vraag });
}

// De toonpagina voor Henkjan (alleen op de beschermde host). ctx: { cat, thuis, euro, esc, aan, toegestaan, GIDSEN }
export function gatenHtml(ctx) {
  const { cat, thuis, euro, esc, aan, toegestaan, GIDSEN } = ctx; const E = x => esc(String(x));
  const blok = GATEN.map((d, n) => {
    const g = GIDSEN[d.slug]; if (!g) return '';
    const top = (g.keuze || []).map(k => ({ k, i: cat[k.pid] })).filter(x => x.i && x.i.vr !== false && (!toegestaan || toegestaan(x.i))).slice(0, 3);
    const nu = top.map(x => E(x.k.label) + ': ' + E(x.k.naam || x.i.t) + ' (' + euro(thuis(x.i)) + ')').join('; ');
    const nieuweOpening = vul(d.opening, cat, thuis, euro, toegestaan), nieuwAntwoord = vul(d.antwoord, cat, thuis, euro, toegestaan);
    const m = d.meting;
    return `<section class="si-sec"><h2>${n + 1}. ${E(d.vraag)}</h2>
<p><b>Gids:</b> <a href="https://gids.kadoly.com/${E(d.slug)}">gids.kadoly.com/${E(d.slug)}</a> (${E(g.h1)}). <a href="/api/gids?op=llmgat&amp;voorbeeld=${E(d.slug)}">Bekijk de hele gids met het gat gevuld</a>.</p>
<p><b>Het gat (level ${E(m.level)}, ${E(m.bron)}, ${E(GEMETEN_DAG)}):</b> een AI zonder webzoeken geeft deze vraag geen eerste keus. Het antwoord noemt ${E(m.genoemd.join(', '))} en geen enkel product dat bij ons te koop is.</p>
<p><i>${E(m.antwoord)}</i></p>
<h3>Nu op de gids</h3><p><b>Kort antwoord toont:</b> ${nu || 'niets leverbaars'}.</p><p><b>Eerste FAQ:</b> ${E((g.faq && g.faq[0] && g.faq[0].v) || '')}</p>
<h3>Nieuw, als jij ja zegt</h3>${nieuweOpening ? `<p><b>Opening:</b> ${E(nieuweOpening)}</p><p><b>Eerste FAQ:</b> ${E(d.vraag)}</p><p><b>Antwoord:</b> ${E(nieuwAntwoord)}</p>` : '<p>Een genoemd product is nu niet leverbaar. Deze gids blijft dan ongewijzigd.</p>'}
</section>`; }).join('');
  return `<p class="kicker">Voorstel voor Henkjan · alleen te zien op deze beschermde pagina</p><h1>5 cadeauvragen waar AI geen goed antwoord geeft</h1>
<p class="standfirst">Taak o9w904, 27 november 2026. Schakelaar nu: <b>${aan ? 'AAN' : 'UIT'}</b>. Zolang hij uit staat is er niets gewijzigd aan wat bezoekers of Google zien op gids.kadoly.com.</p>
<div class="answer lead"><p><strong>Wat dit is.</strong> Per vraag staat de vraag letterlijk als eerste FAQ (met antwoord) en opent de gids met één duidelijke eerste keus en de echte prijs van vandaag, inclusief btw en verzending. Alle producten, maten en eigenschappen komen uit de bestaande gidsen. Prijzen worden bij elk bezoek live uit de winkelcatalogus gelezen; is een genoemd product niet leverbaar, dan blijft die gids zoals hij was.</p></div>
<h2>Hoe ik de vragen koos en hoe goed het bewijs is</h2><ul class="si-punt">
<li>Demand Radar (laatste dag 20 november 2026) bevat geen enkele cadeauvraag in de Nederlandse markt: de open en onduidelijke vragen daar gaan over jassen, energie, verzekeringen en telefoons. Ik heb dus geen vraag uit de radar kunnen nemen.</li>
<li>Daarom zelf gemeten: ${E(GEMETEN_DOOR)}. Dat is één antwoord van één model, geen meting over meerdere AI's en geen zoekvolume. Het level (open, generic, unclear) is mijn inschatting op dezelfde schaal als de radar; geen enkel van de vijf antwoorden noemt een eerste keus.</li>
<li>De vijf gidsen blijven hoe dan ook bestaan: ze staan los van de 20 nieuwe cadeaugidsen en de noindex op productpagina's (taak wjvssw, besluit 28 november).</li>
<li>De proef begint pas bij live zetten: vóór en na op vermeldingen in AI-antwoorden en op bezoek van AI-bots per gids, minimaal 14 dagen. Er loopt nu dus geen proef.</li></ul>
${blok}
<h2>Wat je kiest</h2><p><b>Ja:</b> de schakelaar gaat aan via /api/gids?op=llmgatzet&amp;aan=1 op deze beschermde host; terugdraaien met aan=0. Geen nieuwe uitrol nodig.</p>`;
}
