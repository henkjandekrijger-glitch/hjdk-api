// Redactie van Kadoly op gids.kadoly.com/redactie (Henkjan 19 nov 2026: "Maak iedere dag een post met een redactie die nuttig is voor lezers en bezoekers op kadoly.com"
// en "Meet alles met clickmind . Aan links wat er in komt"). Eén artikel per dag, met de hand geschreven op echte bronnen.
// Onderwerp per artikel: zoekvraag uit Demand Radar (zoekvraag, check, suggesties) plus het gat in AI-antwoorden (llmgat: welke vraag AI nog
// generiek of zonder eerste keus beantwoordt). Werkwijze voor de dagelijkse ronde: OVERDRACHT-KADOLY-GIDS.md, sectie Redactie.
//
// Meting (Clickmind en het baken van de gids):
// - elke externe link loopt via /redactie/<slug>/link/<n> (telt red-<slug>|link-<n> in gk:d:<dag>, daarna 302 naar de bron); interne links direct
// - productkaarten via /naar/<pid>?g=red-<slug>&b=<blok> (keten tot betaald in Clickmind, op=gidsuit in api/shop.js)
// - baken: v-<herkomst>, t15, t60, s50, s90 onder g=red-<slug>; Clickmind cm.js met data-site="kadolyredactie" (klik, scroll, echt mens)
// - stand per artikel: /api/gids?op=redstand
//
// Tekstregels: zoekterm voorop in titel en kop, kort antwoord bovenaan (eerste 60 woorden), elke bewering met een bron die we zelf lazen,
// geen gedachtestreepjes, geen verzonnen reviews of cijfers, eerlijk over wat Kadoly (nog) niet heeft.

export const REDACTIE_DAG = '2026-11-19';

// Stand van Kadoly zelf, één plek: werk dit bij zodra iets verandert (toont op elk artikel met status: true).
export const STATUS = {
  bijgewerkt: '2026-11-19',
  regels: [
    ['Bedrijf', 'Kadoly is een handelsnaam van ADSFAIR B.V., Albert Plesmanplein 20, 2805 AB Gouda, KVK 60126035. Het nummer kun je zelf opzoeken in het handelsregister.', 'kvk'],
    ['WebwinkelKeur', 'Aangevraagd op 19 november 2026. Het logo zetten we pas op de site als de keuring rond is, met een link naar onze ledenpagina bij WebwinkelKeur zelf.', 'wwk'],
    ['Google Klantenreviews', 'We sluiten aan op 19 november 2026. Na een bestelling vraagt Google je zelf of je mee wilt doen; de beoordeling komt pas in beeld als genoeg kopers hebben gereageerd.', 'gcr'],
    ['Retour', '14 dagen na ontvangst melden, met gratis retourlabel.', 'retour'],
    ['Betalen', 'iDEAL, PayPal, creditcard of Klarna. Een account is niet nodig.', ''],
    ['Contact', 'Antwoord van een mens via WhatsApp op +31 6 55395630.', 'wa'],
  ],
  // korte versie voor de kaarten op de pagina: [titel, tekst, link, loopt nog]
  kaarten: [
    ['Bedrijf', 'ADSFAIR B.V., Gouda. KVK 60126035.', 'kvk'],
    ['Retour', '14 dagen, met gratis retourlabel.', 'retour'],
    ['Betalen', 'iDEAL, PayPal, creditcard of Klarna.', ''],
    ['Contact', 'Een mens antwoordt.', 'wa'],
    ['WebwinkelKeur', 'Aangevraagd op 19 november. Logo pas na de keuring.', '', true],
    ['Google Klantenreviews', 'Aansluiting op 19 november. Score volgt na genoeg reviews.', '', true],
  ],
};

export const ARTIKELEN = [
  {
    slug: 'betrouwbare-webshop-herkennen-webwinkelkeur-google-reviews',
    datum: '2026-11-19', bijgewerkt: '2026-11-19', leestijd: 5,
    titel: 'Betrouwbare webshop herkennen: WebwinkelKeur en Google-reviews uitgelegd',
    h1: 'Betrouwbare webshop herkennen voor Black Friday',
    sub: 'Wat WebwinkelKeur en Google Klantenreviews je echt vertellen, en hoe je in een minuut zelf controleert.',
    besch: 'Zo check je in vier stappen of een webshop te vertrouwen is. Wat een keurmerk als WebwinkelKeur wel en niet controleert, hoe Google Klantenreviews werkt en wat je doet als het misgaat.',
    zoektermen: ['betrouwbare webshop herkennen', 'betrouwbare webshop check', 'betrouwbare webshop keurmerk', 'webwinkelkeur betrouwbaar', 'webwinkelkeur klacht indienen', 'google klantenreviews'],
    // gemeten gat in AI-antwoorden (Demand Radar /api/check 19 nov 2026, 4 AI-modellen, en eigen meting zonder webzoeken)
    llmgat: { vraag: 'Hoe herken ik een betrouwbare webshop?', level: 'generic', gemeten: '2026-11-19',
      wat: 'Op "betrouwbare webshop" noemen de AI-modellen winkels (bol, Coolblue, MediaMarkt, Zalando) in plaats van hoe je zelf controleert. Op "webwinkelkeur" noemen ze alleen namen van keurmerken en reviewsites, zonder te zeggen wat een keurmerk wel en niet controleert of hoe je nakijkt of het logo echt is.' },
    kort: 'Een keurmerk zegt pas iets als je het kunt nakijken. Klik op het logo: je hoort op een pagina van het keurmerk zelf te komen, met dezelfde bedrijfsnaam en hetzelfde webadres. Zoek daarna het KVK-nummer op, lees ervaringen buiten de webshop en betaal liefst met PayPal of creditcard, zodat je geld kunt terugvragen als er niets komt.',
    links: [
      { id: 1, url: 'https://www.consumentenbond.nl/online-kopen/betrouwbare-webshop', bron: 'Consumentenbond', titel: 'Betrouwbare webshop herkennen' },
      { id: 2, url: 'https://twinklemagazine.nl/2026/10/thuiswinkel.org-gaat-nepwebshops-24-uur-per-dag-opsporen', bron: 'Twinkle, 8 oktober 2026', titel: 'Thuiswinkel.org gaat nepwebshops 24 uur per dag opsporen' },
      { id: 3, url: 'https://www.abnamro.com/nl/nieuws/onderzoek-abn-amro-7-op-de-10-nederlanders-zeggen-nepwebshops-nauwelijks-nog-te-herkennen', bron: 'ABN AMRO, november 2026', titel: '7 op de 10 Nederlanders zeggen nepwebshops nauwelijks nog te herkennen' },
      { id: 4, url: 'https://www.kvk.nl/veilig-zakendoen/geld-kwijt-en-niets-ontvangen-zo-herken-je-een-nepwebshop/', bron: 'KVK', titel: 'Geld kwijt en niets ontvangen. Zo herken je een nepwebshop' },
      { id: 5, url: 'https://www.consumentenbond.nl/online-kopen/keurmerken-webwinkels', bron: 'Consumentenbond', titel: 'Keurmerken voor webwinkels' },
      { id: 6, url: 'https://webwinkelkeur.nl/wp-content/uploads/2024/06/WebwinkelKeur-AV.pdf', bron: 'WebwinkelKeur', titel: 'Algemene voorwaarden WebwinkelKeur, artikel 4 Keuring' },
      { id: 7, url: 'https://support.google.com/googleshopping/answer/7163734?hl=nl', bron: 'Google', titel: 'Over Google Klantenreviews (voor kopers)' },
      { id: 8, url: 'https://support.google.com/merchants/answer/7124326?hl=nl', bron: 'Google', titel: 'Veelgestelde vragen over Google Klantenreviews' },
      { id: 9, url: 'https://support.google.com/google-ads/answer/2375474?hl=nl', bron: 'Google', titel: 'Over winkelbeoordelingen' },
      { id: 10, url: 'https://www.kvk.nl/zoeken/', bron: 'KVK', titel: 'Zoeken in het Handelsregister' },
      { id: 11, url: 'https://www.fraudehelpdesk.nl/', bron: 'Fraudehelpdesk', titel: 'Fraude melden' },
      { id: 12, url: 'https://www.consumentenbond.nl/veilig-internetten/december-nepshops', bron: 'Consumentenbond', titel: 'Nepshops in december' },
      { id: 13, url: 'https://support.google.com/merchants/answer/14632922?hl=nl', bron: 'Google', titel: 'FAQ over Google Klantenreviews voor winkels' },
    ],
    // [tekst](#n) = gemeten link naar links[n]; [tekst](/pad) = interne link
    blokken: [
      { h2: 'Waarom je juist nu beter kijkt' },
      { p: 'Rond Black Friday, Sinterklaas en kerst duiken de meeste nepwinkels op. De Fraudehelpdesk kreeg in 2025 35% meer meldingen van aankoopfraude dan het jaar ervoor, en volgens de Consumentenbond komt een flink deel daarvan van onbetrouwbare webshops ([Consumentenbond](#1)). Thuiswinkel.org schat dat 1,2 miljoen Nederlanders in 2025 zijn opgelicht via een nepwebshop ([Twinkle](#2)).' },
      { p: 'Het lastige: je ziet het er niet meer aan af. In een peiling van ABN AMRO van oktober 2026 zegt 7 op de 10 Nederlanders dat ze een nepwebshop nauwelijks nog herkennen ([ABN AMRO](#3)). Nepwinkels gebruiken namen en logo\'s van bekende partijen, nep-keurmerken en zelfs iDEAL om echt te lijken ([Consumentenbond](#12)). Kijken naar spelfouten helpt dus niet meer. Nakijken wel.' },
      { h2: 'Zo check je een webshop in vier stappen' },
      { stappen: [
        ['Klik op het keurmerk', 'Een echt keurmerk is een link naar een pagina op de site van het keurmerk zelf, met de naam en het webadres van de winkel. Is het alleen een plaatje, of kom je op een pagina van de winkel zelf, dan is het logo niets waard.'],
        ['Zoek het KVK-nummer op', 'Een Nederlandse webshop zet zijn KVK-nummer en adres op de site. Vul het nummer in bij het [Handelsregister van de KVK](#10) en kijk of naam, adres en activiteit kloppen met wat de winkel zegt.'],
        ['Lees ervaringen buiten de winkel', 'Reviews op de site van de winkel zelf zeggen weinig. Kijk bij Google, bij het keurmerk of op een reviewsite, en let op een plotselinge stroom korte vijfsterrenreviews: die zijn vaak nep.'],
        ['Betaal zo dat je geld kunt terugvragen', 'Met PayPal of een creditcard kun je een betaling terugvragen als er niets geleverd wordt. Een spotgoedkope aanbieding met alleen een bankoverschrijving is een rode vlag.'],
      ] },
      { h2: 'Wat een keurmerk als WebwinkelKeur wel en niet controleert' },
      { p: 'Een keurmerk is geen overheidsstempel maar een private club met eigen regels. WebwinkelKeur keurt een winkel voordat die het logo mag gebruiken ([WebwinkelKeur, artikel 4](#6)). De vijf grote keurmerken controleren bij aanmelding of de site aan de wet voldoet: contactgegevens, het recht op retour en wat je kunt doen bij een klacht ([Consumentenbond](#5)).' },
      { p: 'Wat een keurmerk niet doet: de producten testen, en volgens de Consumentenbond controleren de meeste keurmerken daarna niet regelmatig of een winkel nog aan alle eisen voldoet. Thuiswinkel Waarborg doet dat het grondigst, elk jaar opnieuw ([Consumentenbond](#5)). In het panel van de Consumentenbond kent 40% het logo van WebwinkelKeur en heeft 20% er veel vertrouwen in; bij Thuiswinkel Waarborg is dat 96% en 49%.' },
      { p: 'Het echte voordeel zit in wat er gebeurt als het misgaat. Kom je er met de winkel niet uit, dan kun je bij het keurmerk aankloppen, dat gaat bemiddelen. Meld je klacht wel eerst bij de winkel zelf en bewaar alle mails.' },
      { h2: 'Hoe Google Klantenreviews werkt' },
      { p: 'Google Klantenreviews is geen keurmerk maar een manier om beoordelingen te verzamelen die de winkel niet zelf in handen heeft. Na je bestelling vraagt Google of je mee wilt doen. Zeg je ja, dan mailt Google je een paar dagen na de verwachte bezorgdatum met één vraag over je ervaring ([Google](#7)).' },
      { p: 'Twee dingen maken dit sterker dan reviews op de site zelf. De winkel moet de vraag aan elke koper laten zien en mag de vraag niet al op de bevestigingspagina stellen, zodat je pas oordeelt als je pakket er is ([Google](#13), [Google](#8)). En de score die je naast een advertentie ziet, verschijnt pas bij een beoordeling van 3,5 of hoger ([Google](#9)). Zie je bij een onbekende winkel helemaal geen beoordelingen, dan betekent dat nog niet dat hij nep is, wel dat je de andere drie stappen extra serieus neemt.' },
      { h2: 'Hoe Kadoly het doet' },
      { p: 'We zijn een jonge winkel: Kadoly opende in oktober 2026. Daarom hebben we nog weinig reviews en zijn we nu bezig met WebwinkelKeur en Google Klantenreviews. Dit staat er vandaag:' },
      { status: true },
      { h2: 'Cadeaus die op tijd in huis zijn' },
      { p: 'Pakjesavond is op vrijdag 5 december. Deze cadeaus van makers tot 50 euro hebben een korte levertijd; bij elk product zie je de prijs inclusief btw en verzending en wanneer het in huis is.' },
      { producten: { n: 4, maxLt: 5, minPrijs: 15, maxPrijs: 50 } },
      { h2: 'Opgelicht? Dit doe je meteen' },
      { p: 'Neem contact op met je bank of PayPal om de betaling terug te vragen, meld de winkel bij de [Fraudehelpdesk](#11) en doe aangifte bij de politie ([KVK](#4)). Hoe sneller, hoe groter de kans dat een rekening wordt geblokkeerd.' },
    ],
    faq: [
      ['Is WebwinkelKeur betrouwbaar?', 'WebwinkelKeur keurt een webwinkel voordat die het logo mag voeren en bemiddelt als je er met een aangesloten winkel niet uitkomt. Het test geen producten. Klik altijd op het logo: alleen als je op een pagina van WebwinkelKeur zelf komt met de naam van de winkel, is het lidmaatschap echt.'],
      ['Wat is het verschil tussen WebwinkelKeur en Thuiswinkel Waarborg?', 'Beide keuren bij aanmelding of een winkel aan de wet voldoet. Thuiswinkel Waarborg controleert daarna elk jaar opnieuw en is veel bekender: in het panel van de Consumentenbond kent 96% het logo, tegen 40% bij WebwinkelKeur.'],
      ['Wat is Google Klantenreviews?', 'Een dienst van Google waarbij kopers na hun bestelling kunnen kiezen voor een korte enquête. Google mailt die een paar dagen na de verwachte bezorgdatum. De winkel mag niet kiezen wie de vraag krijgt.'],
      ['Hoe zie ik of een keurmerk op een webshop echt is?', 'Klik erop. Een echt keurmerk linkt naar een ledenpagina op de site van het keurmerk met dezelfde bedrijfsnaam en hetzelfde webadres. Een los plaatje of een link naar de winkel zelf is een slecht teken.'],
      ['Is Kadoly betrouwbaar?', 'Kadoly is een handelsnaam van ADSFAIR B.V. in Gouda, KVK 60126035. Je kunt betalen met PayPal of creditcard, hebt 14 dagen retour met gratis label en krijgt via WhatsApp antwoord van een mens. WebwinkelKeur is aangevraagd en Google Klantenreviews wordt aangezet; we zetten het logo pas neer als de keuring rond is.'],
      ['Wat moet ik doen als ik bij een nepwebshop heb betaald?', 'Vraag de betaling terug via je bank, PayPal of creditcardmaatschappij, meld de winkel bij de Fraudehelpdesk en doe aangifte bij de politie. Bewaar de bevestiging en alle mails.'],
    ],
  },
];

export const ART = Object.fromEntries(ARTIKELEN.map(a => [a.slug, a]));
export const nieuwsteEerst = () => ARTIKELEN.slice().sort((a, b) => String(b.datum).localeCompare(String(a.datum)));
export const linkPad = (a, n) => '/redactie/' + a.slug + '/link/' + n;
export const linkVan = (slug, n) => { const a = ART[slug]; return a ? (a.links || []).find(l => String(l.id) === String(n)) || null : null; };

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// [tekst](#n) of [tekst](/pad) naar een link; een bron tussen haakjes, ([X](#1)) of ([X](#1), [Y](#2)), wordt een voetnootnummer
function opmaak(a, s) {
  const ref = n => { const l = linkVan(a.slug, n); return l ? `<a class="rd-ref" href="${linkPad(a, l.id)}" rel="noopener" data-rl="${l.id}" title="${esc(l.bron + ': ' + l.titel)}">${l.id}</a>` : ''; };
  let t = esc(s).replace(/\s?\(((?:\[[^\]]+\]\(#\d+\)(?:,\s*)?)+)\)/g, (m, binnen) => '<sup>' + [...binnen.matchAll(/\(#(\d+)\)/g)].map(x => ref(x[1])).join('') + '</sup>');
  return t.replace(/\[([^\]]+)\]\((#\d+|\/[a-z0-9\-\/#]*)\)/g, (m, x, h) => {
    if (h[0] === '#') { const l = linkVan(a.slug, h.slice(1)); return l ? `<a href="${linkPad(a, l.id)}" rel="noopener" data-rl="${l.id}">${x}</a>` : x; }
    return `<a href="${h}">${x}</a>`;
  });
}
const platOpmaak = s => String(s).replace(/\s?\(((?:\[[^\]]+\]\(#\d+\)(?:,\s*)?)+)\)/g, '').replace(/\[([^\]]+)\]\((#\d+|\/[^)]*)\)/g, '$1');
const datumNl = d => { try { return new Date(String(d).slice(0, 10) + 'T12:00:00Z').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return String(d); } };

// Kadoly-look (19 nov, Henkjan: "Opmaak van de post moet wel meer kadoly design overnemen . VEEL strakker"): smalle kolom, rustige grijze vlakken,
// voetnootnummers in plaats van bronnamen in de tekst, stappen en status als kaarten, producten als winkelkaarten met zwarte knop.
export const RED_CSS = `<style>
main.wrap{max-width:720px}
.rd-kop{margin:8px 0 28px}.rd-kick{display:flex;gap:10px;align-items:center;font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:700;margin:0 0 14px}.rd-kick a{color:var(--ink);text-decoration:none}.rd-kick span{font-weight:400;text-transform:none;letter-spacing:0;font-size:14px}
.rd-kop h1{font-size:clamp(30px,4.6vw,42px);line-height:1.08;letter-spacing:-.02em;margin:0 0 14px}.rd-kop .rd-sub{font-size:18px;line-height:1.5;margin:0;color:var(--ink)}
main.wrap h2{font-size:24px;letter-spacing:-.01em;margin:40px 0 12px}main.wrap p{font-size:17px;line-height:1.65}
.rd-kop .rd-kort{background:var(--bg-2);border-radius:18px;padding:18px 20px;margin:22px 0 8px;font-size:17px;line-height:1.6}.rd-kort p{margin:0}.rd-kort b{display:block;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 6px}
sup{line-height:0}.rd-ref{display:inline-block;min-width:18px;height:18px;padding:0 5px;margin:0 0 0 3px;border-radius:9px;background:var(--bg-2);color:var(--ink)!important;font-size:11px;font-weight:700;line-height:18px;text-align:center;text-decoration:none!important;vertical-align:2px}.rd-ref:hover{background:var(--prim);color:var(--on-prim)!important}
.rd-st{list-style:none;padding:0;margin:14px 0 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rd-st li{border:1px solid var(--line);border-radius:18px;padding:16px 18px;font-size:16px;line-height:1.5}.rd-st i{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--prim);color:var(--on-prim);font-style:normal;font-weight:700;font-size:14px;margin:0 0 10px}.rd-st b{display:block;font-size:17px;margin:0 0 4px}
.rd-sta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0 6px}.rd-sta div{background:var(--bg-2);border-radius:16px;padding:14px 16px;font-size:15px;line-height:1.45}.rd-sta b{display:flex;gap:6px;align-items:center;font-size:15px;margin:0 0 4px}.rd-sta b::before{content:"";width:16px;height:16px;flex:none;border-radius:50%;background:#16a34a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M4.5 8.2l2.2 2.2 4.8-4.8' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")}.rd-sta div.wacht b::before{background:#f59e0b url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='2' fill='white'/%3E%3C/svg%3E")}.rd-sta a{color:var(--ink);font-weight:700}
.rd-pr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:16px 0 4px}.rd-pk{display:flex;flex-direction:column;text-decoration:none!important}main a.rd-pk:is(.rd-pk,#rd-pk){color:var(--ink)!important}.rd-pk .im{display:block;aspect-ratio:1;border-radius:16px;background:#f3f4f6;overflow:hidden;margin:0 0 10px}.rd-pk img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply;display:block}.rd-pk .n{font-size:14px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px}.rd-pk .p{font-size:17px;font-weight:700;margin:4px 0 2px}.rd-pk .d{font-size:13px;margin:0 0 10px}.rd-pk .k{margin-top:auto;display:block;text-align:center;background:var(--prim);color:var(--on-prim);border-radius:999px;padding:9px 12px;font-size:14px;font-weight:700}.rd-pk:hover .k{opacity:.88}
.rd-bron{counter-reset:b;list-style:none;padding:0;margin:0;font-size:14px;line-height:1.5}.rd-bron li{display:flex;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.rd-bron li span{flex:none;min-width:22px;height:22px;border-radius:11px;background:var(--bg-2);font-size:12px;font-weight:700;display:grid;place-items:center}.rd-bron a{color:var(--ink)}
.rd-lijst{list-style:none;padding:0;margin:0;display:grid;gap:12px}.rd .rd-lijst a:is(a,#rd-a){text-decoration:none!important}.rd-lijst{margin:8px 0 40px!important}.rd-lijst a{display:block;background:var(--bg-2);border:1.5px solid transparent;border-radius:20px;padding:20px 22px;text-decoration:none}.rd-lijst a:hover{border-color:var(--ink)}.rd-lijst b{display:block;font-size:22px;line-height:1.2;letter-spacing:-.01em;margin:0 0 8px}.rd-lijst .rd-dt{font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin:0 0 8px}.rd-bs{display:block;font-size:16px;line-height:1.5}.rd-lees{display:inline-block;margin-top:14px;background:var(--prim);color:var(--on-prim);border-radius:999px;padding:8px 16px;font-size:14px;font-weight:700}.rd .standfirst{font-size:18px;line-height:1.5}
.rd a:is(a,#rd-a){color:var(--ink)!important}.rd p a:not(.rd-ref):is(a,#rd-a),.rd .rd-st a:is(a,#rd-a){text-decoration:underline!important;text-decoration-thickness:1px!important;text-underline-offset:3px}.rd p a:not(.rd-ref):hover{text-decoration-thickness:2px!important}
.rd a.rd-ref:hover:is(a,#rd-a){color:var(--on-prim)!important}.rd .rd-st a,.rd .rd-sta a{font-weight:700}
.rd-noot{font-size:14px!important;line-height:1.5!important;margin:12px 0 0}.rd-dt{display:block;font-size:14px;margin:0 0 4px}.rd-bron a{font-weight:600}
.rd-alle:is(a,#rd-a){display:inline-block;margin-top:8px;font-weight:700;text-decoration:none!important;border:1.5px solid var(--ink);border-radius:999px;padding:9px 18px;font-size:15px}
.rd .kicker,.rd .standfirst,.rd .meta{color:var(--ink)!important}
@media(max-width:720px){.rd-st{grid-template-columns:1fr}.rd-sta{grid-template-columns:repeat(2,minmax(0,1fr))}.rd-pr{grid-template-columns:repeat(2,minmax(0,1fr))}}
</style>`;

// statusblok "Hoe Kadoly het doet": korte kaarten met vinkje (klaar) of stip (loopt nog)
function statusHtml(a) {
  const kaart = ([k, kort, x, wacht]) => {
    let link = '';
    if (x === 'kvk' && linkVan(a.slug, 10)) link = ` <a href="${linkPad(a, 10)}" rel="noopener" data-rl="10">Zoek op</a>`;
    if (x === 'retour') link = ' <a href="https://kadoly.com/returns">Beleid</a>';
    if (x === 'wa') link = ' <a href="https://wa.me/31655395630" rel="noopener nofollow" target="_blank">WhatsApp</a>';
    return `<div${wacht ? ' class="wacht"' : ''}><b>${esc(k)}</b>${esc(kort)}${link}</div>`;
  };
  return `<div class="rd-sta" id="status">${STATUS.kaarten.map(kaart).join('')}</div><p class="meta" style="font-size:14px">Stand van ${esc(datumNl(STATUS.bijgewerkt))}. Oranje loopt nog.</p>`;
}

// producten: korte levertijd, beste score, één per merk; kaarten via /naar (Clickmind-keten tot betaald)
// zoek: lijst woorden, één ervan moet in de titel staan (kleine letters); pids: vaste keuze gaat voor
export function kiesProducten(cat, { n = 4, maxLt = 5, zoek = null, pids = null, minPrijs = 0, maxPrijs = 1e9 } = {}, thuis) {
  const gezien = new Set();
  if (Array.isArray(pids) && pids.length) return pids.map(p => cat && cat[p]).filter(i => i && i.img && i.vr !== false && thuis(i) > 0).slice(0, n);
  const past = i => !Array.isArray(zoek) || !zoek.length || zoek.some(w => String(i.t).toLowerCase().includes(String(w).toLowerCase()));
  return Object.values(cat || {}).filter(i => i && i.id && i.t && i.img && i.vr !== false && Number(i.lt) > 0 && Number(i.lt) <= maxLt && thuis(i) > Math.max(0, minPrijs) && thuis(i) <= maxPrijs && past(i))
    .sort((x, y) => (Number(y.sc) || 0) - (Number(x.sc) || 0)).filter(i => { const b = String(i.b || i.id).toLowerCase(); if (gezien.has(b)) return false; gezien.add(b); return true; }).slice(0, n);
}

// het artikel (HTML van de main, zonder kop en voet)
export function artikelHtml(a, { cat, thuis, euro, leverDatum, nlDatum }) {
  const g = 'red-' + a.slug;
  let blokNr = 0;
  const body = a.blokken.map(b => {
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.p) return `<p>${opmaak(a, b.p)}</p>`;
    if (b.stappen) return `<ol class="rd-st">${b.stappen.map(([k, t], n) => `<li><i>${n + 1}</i><b>${esc(k)}</b>${opmaak(a, t)}</li>`).join('')}</ol>`;
    if (b.status) return statusHtml(a);
    if (b.producten) { blokNr++; const L = kiesProducten(cat, b.producten, thuis); if (!L.length) return '';
      return `<div class="rd-pr">${L.map(i => { const href = `/naar/${encodeURIComponent(i.id)}?g=${encodeURIComponent(g)}&amp;b=prod${blokNr}`; return `<a class="rd-pk" href="${href}" rel="nofollow"><span class="im"><img src="${esc(i.img)}" width="300" height="300" alt="${esc(i.t)}" loading="lazy" decoding="async"></span><span class="n">${esc(i.t)}</span><span class="p">${euro(thuis(i))}</span><span class="d">In huis ${esc(nlDatum(leverDatum(i.lt)))}</span><span class="k">Bekijk</span></a>`; }).join('')}</div>`; }
    return '';
  }).join('\n');
  const faq = (a.faq || []).map(([v, t]) => `<details class="faq"><summary>${esc(v)}</summary><div class="a"><p>${opmaak(a, t)}</p></div></details>`).join('');
  const bronnen = `<h2 id="bronnen">Bronnen</h2><ol class="rd-bron">${(a.links || []).map(l => `<li><span>${l.id}</span><div><a href="${linkPad(a, l.id)}" rel="noopener" data-rl="${l.id}">${esc(l.titel)}</a> · ${esc(l.bron)}</div></li>`).join('')}</ol><p class="rd-noot">Gelezen op ${esc(datumNl(a.bijgewerkt))}. Kadoly verkoopt zelf producten; de genoemde keurmerken en diensten betaalden ons niet en wij hen niet.</p>`;
  const meer = nieuwsteEerst().filter(x => x.slug !== a.slug).slice(0, 3);
  return `<article class="rd"><header class="rd-kop"><p class="rd-kick"><a href="/redactie">Redactie</a><span>${esc(datumNl(a.datum))} · ${a.leestijd} min</span></p><h1>${esc(a.h1)}</h1>${a.sub ? `<p class="rd-sub lead">${esc(a.sub)}</p>` : ''}<div class="rd-kort lead"><b>In het kort</b><p>${opmaak(a, a.kort)}</p></div></header>
${body}
<h2 id="vragen">Vragen</h2>${faq}
${bronnen}
${meer.length ? `<h2>Meer van de redactie</h2><ul class="rd-lijst">${meer.map(x => `<li><a href="/redactie/${esc(x.slug)}"><b>${esc(x.titel)}</b>${esc(x.besch)}</a></li>`).join('')}</ul>` : `<p><a class="rd-alle" href="/redactie">Alle artikelen van de redactie</a></p>`}</article>`;
}

export function artikelLd(a, HOST, ORG) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG,
    { '@type': 'Article', headline: a.titel, name: a.h1, description: a.besch, url: HOST + '/redactie/' + a.slug, mainEntityOfPage: HOST + '/redactie/' + a.slug, inLanguage: 'nl-NL', datePublished: a.datum, dateModified: a.bijgewerkt, author: { '@type': 'Organization', name: 'Kadoly redactie', url: HOST + '/redactie' }, publisher: { '@id': HOST + '/#org' }, keywords: (a.zoektermen || []).join(', '), citation: (a.links || []).map(l => l.url) },
    { '@type': 'FAQPage', mainEntity: (a.faq || []).map(([v, t]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: platOpmaak(t) } })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Kadoly gids', item: HOST + '/' }, { '@type': 'ListItem', position: 2, name: 'Redactie', item: HOST + '/redactie' }, { '@type': 'ListItem', position: 3, name: a.titel, item: HOST + '/redactie/' + a.slug }] }] }).replace(/</g, '\\u003c');
}

export function overzichtHtml() {
  const L = nieuwsteEerst();
  return `<div class="rd"><p class="kicker"><span class="live-dot"></span>Redactie van Kadoly</p><h1>Redactie: elke dag iets wat je echt helpt kiezen en kopen</h1><p class="standfirst">Elke dag een artikel over een vraag waar veel mensen nu mee zitten. Met bronnen die we zelf lazen, en eerlijk over wat wij als winkel wel en niet doen.</p>
<ul class="rd-lijst">${L.map(a => `<li><a href="/redactie/${esc(a.slug)}"><span class="rd-dt">${esc(datumNl(a.datum))} · ${a.leestijd} min</span><b>${esc(a.titel)}</b><span class="rd-bs">${esc(a.besch)}</span><span class="rd-lees">Lees het artikel</span></a></li>`).join('')}</ul></div>`;
}

export function redactieLlms(HOST, vol) {
  return '## Redactie van Kadoly\n\n' + HOST + '/redactie\n\n' + nieuwsteEerst().map(a => {
    let t = '### ' + a.titel + '\n\n' + HOST + '/redactie/' + a.slug + ' (' + a.datum + ')\n\n' + platOpmaak(a.kort) + '\n';
    if (vol) { t += '\n' + a.blokken.map(b => b.h2 ? '#### ' + b.h2 : b.p ? platOpmaak(b.p) : b.stappen ? b.stappen.map(([k, x], i) => (i + 1) + '. ' + k + ': ' + platOpmaak(x)).join('\n') : b.status ? STATUS.regels.map(([k, x]) => '- ' + k + ': ' + x).join('\n') : '').filter(Boolean).join('\n\n') + '\n\n#### Vragen\n\n' + (a.faq || []).map(([v, x]) => '**' + v + '**\n' + platOpmaak(x)).join('\n\n') + '\n\n#### Bronnen\n\n' + (a.links || []).map(l => '- ' + l.titel + ', ' + l.bron + ': ' + l.url).join('\n') + '\n'; }
    return t;
  }).join('\n') + '\n';
}

// pagina's voor sitemap en IndexNow (zelfde vorm als W_PAGINAS in api/gids.js)
export const RED_PAGINAS = () => [{ pad: '/redactie', versie: 'r' + ARTIKELEN.length + '-' + (nieuwsteEerst()[0] || {}).bijgewerkt, lm: (nieuwsteEerst()[0] || {}).bijgewerkt || REDACTIE_DAG, naam: 'Redactie van Kadoly' }]
  .concat(ARTIKELEN.map(a => ({ pad: '/redactie/' + a.slug, versie: 'a-' + a.bijgewerkt, lm: a.bijgewerkt, naam: a.titel })));

// stand per artikel uit gk:d:<dag> (baken, links, productkliks)
export async function redStand(kv, dagen = 14) {
  const per = {};
  for (const a of ARTIKELEN) per[a.slug] = { titel: a.titel, datum: a.datum, lezers: 0, herkomst: {}, t15: 0, t60: 0, s50: 0, s90: 0, links: {}, productKliks: 0, ai: a.llmgat ? a.llmgat.level : null };
  for (let i = 0; i < dagen; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    let arr = null; try { arr = await kv.raw(['HGETALL', 'gk:d:' + d]); } catch (e) {}
    if (!Array.isArray(arr)) continue;
    for (let j = 0; j + 1 < arr.length; j += 2) {
      const m = String(arr[j]).match(/^red-([a-z0-9-]+)\|(.+)$/); if (!m || !per[m[1]]) continue;
      const s = per[m[1]], k = m[2], n = Number(arr[j + 1]) || 0;
      if (k.startsWith('v-')) { s.lezers += n; s.herkomst[k.slice(2)] = (s.herkomst[k.slice(2)] || 0) + n; }
      else if (k === 't15' || k === 't60' || k === 's50' || k === 's90') s[k] += n;
      else if (k.startsWith('link-')) s.links[k.slice(5)] = (s.links[k.slice(5)] || 0) + n;
      else if (k.startsWith('uit-')) s.productKliks += n;
    }
  }
  return { ok: true, dagen, artikelen: per };
}
