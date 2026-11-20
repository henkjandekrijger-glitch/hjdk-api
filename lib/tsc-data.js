// True Surgery Cost (Henkjan 14 nov 2026: "wereldwijd aanpakken ... gekeken vanuit een bepaald land naar de landen waar je heen kunt ... ASAP mentions in AI assistents").
// Alleen feiten met bron. Bronnen van klinieken of bemiddelaars staan gemarkeerd als commercial: true.
// Routekaart (herkomst -> bestemming) met bewijs: data/tsc-routes.json. Zoekvraag gemeten 14 nov 2026 in Keyword Planner (US: hair transplant turkey 27.100/mnd, tummy tuck cost 33.100/mnd).

// Henkjan 14 nov 2026: "Nee niet kopen . Wil naam laten marineren": voorlopig op todayin.email/surgery (zelfde merk als de ochtendmail).
// 18 nov 2026 (Henkjan: "Zet surgery ook onder de keuze hulpen is logischer dan iedere dag mailen . Nee zo veel mogelijk over"): naar keuzehulp.best/chirurgie, één domein en één funnel met de andere keuzehulpen; todayin.email/surgery stuurt met 301 door.
// Per taal op de eigen keuzehulp (20 nov 2026, Henkjan: "Totaal overnemen op keuzehulpen ... Is geen nieuwsbrief maar een keuzehulp"):
// Engels op whichtobuy.best/surgery, Nederlands op keuzehulp.best/chirurgie/nl, Duits op kaufberater.best/chirurgie/de. todayin.email/surgery stuurt door.
export const NAAM = {en:'Surgery guide',nl:'Keuzehulp chirurgie',de:'Ratgeber Chirurgie'};
export const BASIS_TAAL = { en: 'https://whichtobuy.best/surgery', nl: 'https://keuzehulp.best/chirurgie', de: 'https://kaufberater.best/chirurgie' };
export const taalVanSlug = s => /^nl(\/|$)/.test(s || '') ? 'nl' : /^de(\/|$)/.test(s || '') ? 'de' : 'en';
export const absUrl = s => BASIS_TAAL[taalVanSlug(s)] + (s ? '/' + s : '');
export const SITE = { name: 'Keuzehulp chirurgie', base: 'https://keuzehulp.best/chirurgie', host: 'keuzehulp.best', updated: '2026-11-20' };

export const SRC = {
  evz: { t: 'EVZ (European Consumer Centre Germany): hair transplants abroad', u: 'https://www.evz.de/themen/gesundheit/kosmetische-behandlungen/haartransplantation/' },
  medihair: { t: 'Medihair: hair transplant cost by country', u: 'https://medihair.com/en/hair-transplant-cost/', commercial: true },
  scotsman: { t: 'The Scotsman: hair transplant cost in Turkey compared to the UK', u: 'https://www.scotsman.com/must-read/how-much-does-a-hair-transplant-cost-in-turkey-compared-to-the-uk-5381130', commercial: true },
  tuik: { t: 'Dunya (TUIK figures): 1,538,643 health tourists in Turkey in 2023', u: 'https://www.dunya.com/saglik/saglikta-ortadogunun-yerini-avrupa-ve-abd-aldi-haberi-734733' },
  ishrsBlack: { t: 'ISHRS: the black market of hair transplants', u: 'https://fightthefight.ishrs.org/black-market-hair-transplant/' },
  ishrs2025: { t: 'ISHRS 2025 practice census (via PR Newswire)', u: 'https://www.prnewswire.com/il/news-releases/new-survey-finds-younger-adults-more-women-seeking-treatment-for-hair-loss-302475482.html' },
  khaleej: { t: 'Khaleej Times: cheap hair transplants abroad are risky, warn UAE experts', u: 'https://www.khaleejtimes.com/health/cheap-hair-transplants-abroad-are-risky-warn-uae-health-experts' },
  mondaqTr: { t: 'Mondaq: Turkey health tourism regulation of 26 April 2025', u: 'https://www.mondaq.com/turkey/healthcare/1618078/' },
  healthturkiye: { t: 'HealthTurkiye (official register of licensed health tourism providers)', u: 'https://www.healthturkiye.gov.tr' },
  fcdoTr: { t: 'UK FCDO travel advice Turkey: health', u: 'https://www.gov.uk/foreign-travel-advice/turkey/health' },
  aspsCost: { t: 'ASPS: average cost of cosmetic procedures 2024 (surgeon fee only)', u: 'https://www.plasticsurgery.org/documents/news/statistics/2024/cosmetic-procedures-average-cost-2024.pdf' },
  cdcDr: { t: 'CDC MMWR: deaths of US citizens after cosmetic surgery in the Dominican Republic, 2009 to 2022', u: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7303a3.htm' },
  springerDr: { t: 'Aesthetic Plastic Surgery: complications of cosmetic tourism treated in the US (214 patients)', u: 'https://link.springer.com/10.1007/s00266-022-03041-z' },
  cidrap: { t: 'CIDRAP: fungal meningitis outbreak after surgery in Matamoros, Mexico (2023)', u: 'https://www.cidrap.umn.edu/meningitis/report-details-deadly-medical-tourism-related-fungal-meningitis-outbreak' },
  baaps: { t: 'BAAPS: patients treated in the UK after cosmetic surgery abroad (2024)', u: 'https://baaps.org.uk/media/press_releases/1889/' },
  bmjNhs: { t: 'BMJ Open via Healthcare Management: NHS cost of medical tourism complications', u: 'https://www.healthcare-management.uk/medical-tourism-complications-cost-nhs-20k-patient-research' },
  aspsMedicaid: { t: 'ASPS: medical tourism for cosmetic surgery, cost of treating complications', u: 'https://www.plasticsurgery.org/news/press-releases/medical-tourism-for-cosmetic-surgery-high-risk-of-complications-high-costs-for-treatment' },
  bapras: { t: 'BAPRAS: think over before you make over (cosmetic surgery abroad)', u: 'https://www.bapras.org.uk/public/think-over-before-you-make-over/cosmetic-surgery-abroad' },
  medicare: { t: 'Medicare: travel outside the US', u: 'https://www.medicare.gov/coverage/travel-outside-the-u.s.' },
  turkeyPrices: { t: 'In Your Pocket: cosmetic surgery in Turkey prices', u: 'https://www.inyourpocket.com/turkey/articles/cosmetic-surgery-in-turkey', commercial: true },
  drPrices: { t: 'PlacidWay: plastic surgery in the Dominican Republic, packages and cost', u: 'https://www.placidway.com/article/3779/Plastic-Surgery-in-Dominican-Republic-Packages-Cost', commercial: true },
  crPrices: { t: 'Medical Tourism Packages: plastic surgery in Costa Rica', u: 'https://www.medicaltourismpackages.com/plastic-surgery-in-costa-rica/', commercial: true },
  colombia30: { t: 'Forbes Colombia: 30% of cosmetic surgery patients in Colombia were foreign in 2024', u: 'https://forbes.co/2025/06/27/actualidad/en-2024-el-30-de-los-pacientes-de-cirugias-esteticas-de-colombia-fueron-extranjeros/' },
  colombiaCheck: { t: 'Noticias RCN: how to verify a cosmetic surgeon in Colombia', u: 'https://www.noticiasrcn.com/salud-y-bienestar/la-ruta-de-verificacion-de-medicos-y-especialistas-en-cirugia-estetica-en-colombia-1049400' },
  ley1799: { t: 'Colombia Law 1799 of 2016 (no cosmetic surgery under 18)', u: 'https://normograma.supersalud.gov.co/compilacion/docs/ley_1799_2016.htm' },
  antioquia: { t: 'Publimetro: 125 hospitalisations after illegal cosmetic procedures in Antioquia, 2024', u: 'https://www.publimetro.co/medellin/2024/12/02/cirugias-esteticas-clandestinas-en-medellin-dejan-125-hospitalizaciones-y-14-muertes-en-el-2024/' },
  mxSpec: { t: 'UnoTV: only 2,690 certified plastic surgeons in Mexico (claim, Oct 2025)', u: 'https://www.unotv.com/salud/en-mexico-solo-2-mil-690-cirujanos-plasticos-estan-certificados-25-mil-ejercen-sin-certificacion/' },
  conamed: { t: 'CONAMED (Mexico medical arbitration commission)', u: 'https://www.gob.mx/cms/uploads/attachment/file/882442/Por_que_acudir_a_CONAMED.pdf' },
  sodocipre: { t: 'Acento: three in four plastic surgeons not qualified (SODOCIPRE certification)', u: 'https://acento.com.do/actualidad/tres-de-cada-cuatro-cirujanos-plasticos-no-estan-calificados-para-ejercer-la-especialidad-8234105.html' },
  thaiCheck: { t: 'Thai Medical Council doctor check', u: 'https://checkmd.tmc.or.th/En' },
  thaiJci: { t: 'The Nation: Thailand has 60 JCI-accredited hospitals (Jan 2024)', u: 'https://www.nationthailand.com/thailand/economy/40034890' },
  smartraveller: { t: 'Smartraveller (Australia): medical tourism', u: 'https://www.smartraveller.gov.au/medical-tourism' },
  rbwh: { t: 'AJOPS: cost of complications of overseas breast implants at the Royal Brisbane and Women\'s Hospital', u: 'https://ajops.com/article/37631-the-financial-burden-of-complications-of-overseas-breast-implants-at-the-royal-brisbane-and-women-s-hospital' },
  koreaVol: { t: 'Asia Economy: 1.17 million foreign patients in Korea in 2024, 11.4% plastic surgery', u: 'https://view.asiae.co.kr/en/article/2025040210053031525' },
  koreaCctv: { t: 'Korea Times: operating room CCTV made mandatory on request', u: 'https://www.koreatimes.co.kr/amp/southkorea/health/20230924/patients-doctors-at-loggerheads-as-operating-room-cctv-footage-made-mandatory' },
  isapsAbroad: { t: 'ISAPS: finding a surgeon abroad', u: 'https://www.isaps.org/discover/patients-home/considering-your-procedure-abroad/finding-a-surgeon-abroad/' },
  aspsEyelid: { t: 'ASPS: eyelid surgery cost (average surgeon fee)', u: 'https://www.plasticsurgery.org/cosmetic-procedures/eyelid-surgery/cost' },
  zorgwijzerOog: { t: 'Zorgwijzer: vergoeding ooglidcorrectie 2026', u: 'https://www.zorgwijzer.nl/vergoeding/ooglidcorrectie' },
  consBondOog: { t: 'Consumentenbond: vergoeding bovenooglidcorrectie', u: 'https://www.consumentenbond.nl/zorgverzekering/vergoedingen/bovenooglidcorrectie' },
  apoUmschau: { t: 'Apotheken Umschau: Schlupflider, wann die Kasse zahlt', u: 'https://www.apotheken-umschau.de/mein-koerper/augen/schlupflider-ursachen-beschwerden-und-behandlung-1539649.html' },
  radarHaar: { t: 'Radar (AVROTROS): haartransplantaties, criteria en behandelen in het buitenland (2021)', u: 'https://radar.avrotros.nl/artikel/haartransplantaties-criteria-behandelingen-in-buitenland-alternatieven-en-meer-50871' },
  ecdcBot: { t: 'ECDC: botulism after intragastric botox in Turkey, 2023', u: 'https://www.ecdc.europa.eu/en/news-events/botulism-iatrogenic-update-cases-europe-march-2023' },
  aspsLipo: { t: 'ASPS: liposuction cost (average surgeon fee)', u: 'https://www.plasticsurgery.org/cosmetic-procedures/liposuction/cost' },
  evzLipo: { t: 'EVZ (European Consumer Centre Germany): liposuction abroad, costs', u: 'https://www.evz.de/themen/gesundheit/kosmetische-behandlungen/fettabsaugung/' },
  apoLipo: { t: 'Apotheken Umschau: Fettabsaugung beim Lipödem, wann die Krankenkasse zahlt (updated Sept 2026)', u: 'https://www.apotheken-umschau.de/therapie/therapiearten/fettabsaugung-liposuktion-wann-krankenkasse-zahlt-1371791.html' },
  geldLipo: { t: 'Geld.nl: vergoeding liposuctie (Nov 2026)', u: 'https://www.geld.nl/zorgverzekering/vergoedingen/liposuctie' },
  zinLipo: { t: 'Zorginstituut Nederland: liposuctie bij lipoedeem (nog) niet bewezen effectief (May 2022)', u: 'https://www.zorginstituutnederland.nl/binaries/zinl/documenten/magazine/2022/05/01/standpunt-zorginstituut-liposuctie-bij-lipoedeem-nog-niet-bewezen-effectief/Liposuctie+bij+lipoedeem+%28nog%29+niet+bewezen++effectief+.pdf' },
  consPlast: { t: 'Consumentenbond: vergoeding plastische chirurgie 2027', u: 'https://www.consumentenbond.nl/zorgverzekering/vergoedingen/plastische-chirurgie' },
  zorgwijzer2027: { t: 'Zorgwijzer: zorgverzekering 2027, premies', u: 'https://www.zorgwijzer.nl/zorgverzekering-2027' },
  aspsBreast: { t: 'ASPS: breast augmentation cost (average surgeon fee)', u: 'https://www.plasticsurgery.org/cosmetic-procedures/breast-augmentation/cost' },
  geldBorst: { t: 'Geld.nl: vergoeding borstvergroting (bijgewerkt 12 nov 2026)', u: 'https://www.geld.nl/zorgverzekering/vergoedingen/borstvergroting' },
  rdgf2026: { t: 'Reinier de Graaf ziekenhuis: prijslijst onverzekerde zorg 2026', u: 'https://media.reinierdegraaf.nl/20260327160618/Prijslijst-onverzekerde-zorg-2026.pdf' },
  zkPlast2027: { t: 'Zilveren Kruis: vergoeding plastische chirurgie bij medische noodzaak 2027', u: 'https://www.zilverenkruis.nl/consumenten/vergoedingen/plastische-chirurgie-bij-medische-noodzaak' },
  vzhhImplant: { t: 'Verbraucherzentrale Hamburg: Brustimplantat muss raus, wer zahlt? (Stand April 2025)', u: 'https://www.vzhh.de/themen/gesundheit-patientenschutz/behandlungsfehler/brustimplantat-muss-raus-wer-zahlt' },
  apoBrust: { t: 'Apotheken Umschau: Brustvergrößerung (Mammaaugmentation), aktualisiert 2017', u: 'https://www.apotheken-umschau.de/therapie/therapiearten/brustvergroesserung-mammaaugmentation-743501.html' },
  geldPlast: { t: 'Geld.nl: vergoeding plastische chirurgie 2027 (bijgewerkt 12 nov 2026)', u: 'https://www.geld.nl/zorgverzekering/vergoedingen/plastische-chirurgie' },
  aspsReduction: { t: 'ASPS: breast reduction cost (average surgeon fee, aesthetic patients)', u: 'https://www.plasticsurgery.org/reconstructive-procedures/breast-reduction/costs' },
  geldVerklein: { t: 'Geld.nl: vergoeding borstverkleining (bijgewerkt 12 nov 2026)', u: 'https://www.geld.nl/zorgverzekering/vergoedingen/borstverkleining' },
  uniVerklein: { t: 'Univé: vergoeding borstverkleining', u: 'https://www.unive.nl/zorgverzekering/vergoedingen/borstverkleining' },
  apoVerklein: { t: 'Apotheken Umschau: Brustverkleinerung, aktualisiert Dezember 2022', u: 'https://www.apotheken-umschau.de/mein-koerper/weibliche-geschlechtsorgane/brustverkleinerung-was-gibt-es-zu-beachten-907181.html' },
  verivoxVerklein: { t: 'Verivox: Brustverkleinerung, wann zahlt die Krankenkasse', u: 'https://www.verivox.de/krankenversicherung/themen/brustverkleinerung/' },
  verivoxPkv: { t: 'Verivox: Brustverkleinerung, wann zahlt die private Krankenversicherung', u: 'https://www.verivox.de/private-krankenversicherung/ratgeber/brustverkleinerung-und-vergroesserung-wann-zahlt-die-private-krankenkasse-1118623/' },
  khVerklein: { t: 'krankenhaus.de: Brustverkleinerung, Kosten', u: 'https://www.krankenhaus.de/schoenheitschirurgie/schoenheits-operation/brustverkleinerung/', commercial: true }
};

// Thuisland: munt en standaardwaarden voor de rekenhulp (schattingen die de lezer zelf aanpast; geen bron nodig, het zijn invulvelden)
export const HOME = {
  us: { label: 'United States', cur: '$', flight: 900, night: 90 },
  uk: { label: 'United Kingdom', cur: '£', flight: 250, night: 70 },
  ca: { label: 'Canada', cur: 'C$', flight: 1100, night: 110 },
  au: { label: 'Australia', cur: 'A$', flight: 1200, night: 110 },
  nl: { label: 'Nederland', cur: '€', flight: 300, night: 70 },
  de: { label: 'Deutschland', cur: '€', flight: 250, night: 70 }
};
// per taal welke thuislanden de rekenhulp en de aanmelding tonen
export const HOMES = { en: ['us', 'uk', 'ca', 'au'], nl: ['nl'], de: ['de'] };

export const PAGES = {
  'hair-transplant-turkey': {
    taal: 'en', ingreep: 'hair', naar: 'turkey', alt: 'haar',
    title: 'Hair transplant in Turkey: true cost and 5 checks (2026)',
    h1: 'Hair transplant in Turkey: what it really costs, and how to check who operates',
    desc: 'Turkey vs home prices from the German consumer centre, the full trip cost, the 2025 Turkish rules and the five checks that matter. Independent, with sources.',
    kort: 'An EVZ comparison of Internet offers, updated in October 2024, listed about EUR 2,400 in Turkey and EUR 6,800 in Germany for medium hair loss. These are historical examples, not current quotes. Check the doctor, facility, procedure and aftercare: the ISHRS warns that in many clinics technicians, not doctors, do the surgery. Ask in writing which named doctor does which step, check the clinic on HealthTurkiye, and judge results at 12 months, not week one.',
    calc: { proc: 'hair transplant', abroad: { us: 2700, uk: 2300, ca: 3600, au: 4100 }, home: { us: 13600, uk: 9500, ca: 15000, au: 15000 }, nights: 3, extras: { us: 150, uk: 120, ca: 180, au: 200 } },
    secties: [
      { h: 'What it costs', p: [
        'The German consumer centre EVZ’s Internet offer comparison, updated in October 2024, covered medium hair loss: about EUR 6,800 in Germany, EUR 5,200 in Poland, EUR 3,400 in Hungary and EUR 2,400 in Turkey. [evz]',
        'For about 2,500 grafts, a price comparison by Medihair puts the US at about $13,600 and Turkey at about $2,700. That source sells hair transplants, so treat it as a rough guide. [medihair]',
        'Packages usually include the procedure, 2 to 3 hotel nights, airport transfers, an interpreter, medicine and the first wash. Flights, extra nights and travel insurance are usually extra.'
      ] },
      { h: 'Who actually operates', p: [
        'The International Society of Hair Restoration Surgery warns about a black market in which unlicensed technicians perform the surgery while the doctor named on the website is not in the room. [ishrsBlack]',
        'In the 2025 ISHRS survey, 59% of member doctors said illegal hair clinics operate in their own city. [ishrs2025]',
        'In the UAE, one clinic said about a quarter of its patients needed a repair after a transplant abroad, and another put it far higher, mostly after Turkey (2019). [khaleej]'
      ] },
      { h: 'The 2025 Turkish rules', p: [
        'A regulation of 26 April 2025 replaced the 2017 rules. Hospitals and clinics that treat foreign patients need a licence, intermediaries need a USHAS licence and a 24/7 call centre in at least two foreign languages, and complication insurance became mandatory for surgery. [mondaqTr]',
        'HealthTurkiye is the official register of licensed providers. It registers clinics and intermediaries, not individual surgeons, so you still need to check the doctor yourself. [healthturkiye]',
        'Turkey counted 1,538,643 health tourists in 2023. [tuik]'
      ] },
      { h: 'Five checks before you book', l: [
        'Get the name of the doctor who will do the extraction and the implantation, in writing.',
        'Check that the clinic and any agency are listed on HealthTurkiye.',
        'Ask for the number of grafts only after they have seen photos of your donor area, not as a fixed package number.',
        'Ask for results of real patients at 12 months, not photos from the first days.',
        'Ask what happens and who pays if something goes wrong, and get the complication insurance in writing.'
      ] }
    ],
    faq: [
      { q: 'How much is a hair transplant in Turkey?', a: 'Historical EVZ Internet offer examples from October 2024 for medium hair loss: about EUR 2,400 in Turkey and EUR 6,800 in Germany. Request a current itemised quote. Clinic packages with hotel and transfers are often GBP 2,000 to 4,000, according to UK price comparisons.' },
      { q: 'Is a hair transplant in Turkey safe?', a: 'A website cannot establish that a treatment is safe for you. Qualifications, the facility, the procedure and aftercare all matter. ISHRS warns about unlicensed technicians operating instead of doctors. Ask in writing who does each step and check the clinic on HealthTurkiye.' },
      { q: 'How long do I need to stay in Turkey?', a: 'Usually 3 to 4 days: the procedure, a check the next day and the first wash.' },
      { q: 'What changed in Turkey in 2025?', a: 'A regulation of 26 April 2025 made complication insurance mandatory for surgery and requires licensed intermediaries with a 24/7 call centre.' }
    ],
    verwant: ['check-surgeon-turkey', 'tummy-tuck-abroad-cost', 'eyelid-surgery-cost']
  },
  'tummy-tuck-abroad-cost': {
    taal: 'en', ingreep: 'tummy', naar: 'abroad',
    title: 'Tummy tuck abroad: true cost vs home, with the risks (2026)',
    h1: 'Tummy tuck abroad: the true cost, from the US, UK, Canada or Australia',
    desc: 'US surgeon fees from ASPS against Mexico, the Dominican Republic, Colombia and Turkey, the days you must stay, and what complications cost at home. With sources.',
    kort: 'In the US the surgeon fee alone for a tummy tuck is $8,000 to $13,500 (ASPS 2024), before anaesthesia and the operating room. Packages abroad are often $3,000 to $5,500, but you need to stay 10 to 14 days and should not fly for 7 to 10 days. The biggest cost risk comes after you are home: in the UK the NHS spent up to GBP 19,549 per patient on complications of surgery abroad.',
    calc: { proc: 'tummy tuck', abroad: { us: 4500, uk: 3800, ca: 5500, au: 6000 }, home: { us: 13500, uk: 8000, ca: 14000, au: 15000 }, nights: 12, extras: { us: 400, uk: 300, ca: 450, au: 450 } },
    secties: [
      { h: 'What it costs', p: [
        'ASPS puts the US surgeon fee for a tummy tuck at $8,000 to $13,500 in 2024. Anaesthesia, the operating room and garments come on top. [aspsCost]',
        'Package prices abroad, from clinics and agents, so treat them as a rough guide: Turkey EUR 3,000 to 5,500, Dominican Republic $3,000 to 5,500, Costa Rica $4,000 to 6,500. [turkeyPrices] [drPrices] [crPrices]',
        '30% of cosmetic surgery patients in Colombia were foreign in 2024, many from the US, Spain and Canada. [colombia30]'
      ] },
      { h: 'How long you must stay', p: [
        'BAPRAS advises not to fly for 7 to 10 days after a tummy tuck. Plan 10 to 14 days in total, with a companion if you can. Long flights after abdominal surgery raise the risk of blood clots. [bapras]'
      ] },
      { h: 'The risks in numbers', p: [
        'The CDC counted 93 US citizens who died after cosmetic surgery in the Dominican Republic between 2009 and 2022. Since 2019 the Dominican health ministry limits operations to two major procedures at a time. [cdcDr]',
        'In a review of 214 patients treated in the US for complications of cosmetic surgery abroad, 82.7% had been operated in the Dominican Republic. [springerDr]',
        'In Matamoros, Mexico, 24 patients got fungal meningitis after an epidural during cosmetic surgery in 2023, and 12 of them died. [cidrap]',
        'Of 103 patients treated in the UK after surgery abroad, 28% had had a tummy tuck; 33% had wound problems and 29% a seroma. [baaps]'
      ] },
      { h: 'Who pays if it goes wrong', p: [
        'Medicare generally does not cover care outside the US. [medicare]',
        'Treating complications of surgery abroad cost the US system about $18,000 per patient on average, often paid by Medicaid (ASPS). [aspsMedicaid]',
        'In the UK, NHS hospitals spent between GBP 1,058 and GBP 19,549 per patient on complications of medical tourism. [bmjNhs]'
      ] }
    ],
    faq: [
      { q: 'How much does a tummy tuck cost in the US?', a: 'The surgeon fee alone is $8,000 to $13,500 according to ASPS (2024). Anaesthesia, the operating room and garments come on top.' },
      { q: 'How much is a tummy tuck abroad?', a: 'Packages are often $3,000 to $5,500 in Turkey, the Dominican Republic or Colombia, according to clinics and agents. Add 10 to 14 days of stay and flights.' },
      { q: 'When can I fly after a tummy tuck?', a: 'BAPRAS advises waiting 7 to 10 days. Plan a stay of 10 to 14 days.' },
      { q: 'Is a tummy tuck in the Dominican Republic safe?', a: 'The CDC counted 93 US deaths after cosmetic surgery there between 2009 and 2022. Choose a SODOCIPRE-certified surgeon and no more than two major procedures in one operation.' }
    ],
    verwant: ['check-surgeon-dominican-republic', 'check-surgeon-mexico', 'check-surgeon-colombia', 'check-surgeon-turkey']
  },
  'eyelid-surgery-cost': {
    taal: 'en', ingreep: 'eyelid', naar: 'home', alt: 'ooglid',
    title: 'Eyelid surgery cost in 2026: surgeon fees and the full bill',
    h1: 'Eyelid surgery cost: the surgeon fee, the full bill and when insurance pays',
    desc: 'ASPS average surgeon fees for upper and lower eyelid surgery, what comes on top, and when insurance pays in the Netherlands and Germany. With sources.',
    kort: 'The American Society of Plastic Surgeons puts the average surgeon fee at $3,359 for upper eyelid surgery and $3,876 for lower eyelid surgery. That is only part of the bill: anaesthesia, the operating room and other costs come on top. [aspsEyelid] Insurance pays only when it is medically needed. In the Netherlands that means a serious loss of your field of vision, measured by an eye doctor with a visual field test. [zorgwijzerOog]',
    secties: [
      { h: 'What it costs', p: [
        'ASPS average surgeon fee: $3,359 for upper eyelid surgery (blepharoplasty) and $3,876 for lower eyelid surgery. The fee does not include anaesthesia, the operating room or other related costs. [aspsEyelid]',
        'In the Netherlands, Zorgwijzer estimates about EUR 700 per eye for upper eyelid surgery at 2026 rates. [zorgwijzerOog]',
        'Ask every clinic for one all-in price in writing: surgeon, anaesthesia, operating room, check-ups and what happens if a correction is needed.'
      ] },
      { h: 'When insurance pays', p: [
        'Netherlands: basic insurance pays for upper eyelid surgery only when the lid seriously limits your field of vision, measured by an eye doctor with a visual field test, or when the cause is a condition you were born with. You need a referral, a medical adviser of the insurer decides, and your deductible (eigen risico) applies. [zorgwijzerOog]',
        'Germany: the statutory health insurer decides case by case. The eye doctor documents the problem, for example a limited field of vision, and the insurer checks whether it is medically necessary. [apoUmschau]',
        'Lower eyelid surgery for looks is not covered. [zorgwijzerOog]'
      ] },
      { h: 'Before you book', l: [
        'Have your field of vision tested first if your upper lids hang over your lashes: it decides whether insurance pays.',
        'Ask who operates: a plastic surgeon or an eye surgeon (oculoplastic) with experience in eyelids.',
        'Ask for the all-in price and the price of a correction, in writing.'
      ] }
    ],
    faq: [
      { q: 'How much does eyelid surgery cost?', a: 'ASPS gives an average surgeon fee of $3,359 for the upper lids and $3,876 for the lower lids. Anaesthesia and the operating room come on top.' },
      { q: 'Does insurance pay for eyelid surgery?', a: 'Only when it is medically needed. In the Netherlands that is a serious loss of field of vision measured by an eye doctor; in Germany the insurer decides case by case.' },
      { q: 'Is lower eyelid surgery covered?', a: 'Not when it is done for looks.' }
    ],
    verwant: ['nl/ooglidcorrectie-kosten', 'hair-transplant-turkey']
  },
  'nl/haartransplantatie-turkije': {
    taal: 'nl', ingreep: 'hair', naar: 'turkey', alt: 'haar',
    title: 'Haartransplantatie Turkije: echte kosten en 5 checks (2026)',
    h1: 'Haartransplantatie in Turkije: wat het echt kost en hoe je checkt wie opereert',
    desc: 'Prijzen Turkije tegen Nederland en Duitsland, de hele reis in één bedrag, de Turkse regels van 2025 en vijf checks voor je boekt. Onafhankelijk, met bronnen.',
    kort: 'In een EVZ-vergelijking van internetaanbiedingen voor gemiddeld haarverlies, bijgewerkt in oktober 2024, stond EUR 2.400 voor Turkije en EUR 6.800 voor Duitsland. Dit zijn historische voorbeelden, geen actuele offertes. [evz] In Nederland noemt een cosmetisch arts EUR 4.000 tot 7.000 voor het maximum van 3.500 haarzakjes. [radarHaar] Beoordeel de arts, locatie, ingreep en nazorg afzonderlijk. Vraag schriftelijk welke arts welke stap doet en zoek de kliniek op in het officiële register HealthTurkiye. [ishrsBlack] [healthturkiye]',
    calc: { proc: 'haartransplantatie', abroad: { nl: 2400 }, home: { nl: 5500 }, nights: 3, extras: { nl: 120 } },
    secties: [
      { h: 'Wat het kost', p: [
        'Het EVZ vergeleek internetaanbiedingen voor gemiddeld haarverlies, bijgewerkt in oktober 2024: ongeveer EUR 6.800 in Duitsland, EUR 5.200 in Polen, EUR 3.400 in Hongarije en EUR 2.400 in Turkije. [evz]',
        'In Nederland geldt een maximum van 3.500 haarzakjes per behandeling. Cosmetisch arts Natale Adamo noemt daarvoor een prijs tussen EUR 4.000 en EUR 7.000 (2021). [radarHaar]',
        'Een pakket in Turkije bevat meestal de ingreep, 2 tot 3 hotelnachten, vervoer van en naar het vliegveld, een tolk, medicijnen en de eerste wasbeurt. Vlucht, extra nachten en reisverzekering betaal je meestal apart.'
      ] },
      { h: 'Wie er echt opereert', p: [
        'De internationale vereniging van haarchirurgen ISHRS waarschuwt voor een zwarte markt waarin technici zonder bevoegdheid opereren, terwijl de arts van de website niet in de zaal staat. [ishrsBlack]',
        'In de ISHRS-enquête van 2025 zei 59% van de aangesloten artsen dat er in hun eigen stad illegale haarklinieken zijn. [ishrs2025]'
      ] },
      { h: 'De Turkse regels sinds 2025', p: [
        'Een regeling van 26 april 2025 verving die van 2017. Ziekenhuizen en klinieken die buitenlandse patiënten behandelen hebben een vergunning nodig, bemiddelaars een USHAS-vergunning en een callcenter dat dag en nacht in minstens twee vreemde talen bereikbaar is, en een verzekering voor complicaties is verplicht bij een operatie. [mondaqTr]',
        'HealthTurkiye is het officiële register van klinieken en bemiddelaars met een vergunning. Het noemt geen losse chirurgen, dus de arts check je zelf. [healthturkiye]'
      ] },
      { h: 'Nazorg vanuit Nederland', p: [
        'Adamo raadt een buitenlandse kliniek zonder vestiging in Nederland af: de nazorg is volgens hem minstens zo belangrijk als de operatie. Let op keurmerken zoals ZKN of ISO en op lidmaatschap van een wetenschappelijke vereniging. [radarHaar]',
        'Van de getransplanteerde haren blijft volgens hem 80 tot 85% zitten als de nazorg goed is. Elders op je hoofd kan het haar blijven uitvallen. [radarHaar]'
      ] },
      { h: 'Vijf checks voor je boekt', l: [
        'Vraag de naam van de arts die de haarzakjes weghaalt en die ze plaatst, op papier.',
        'Zoek de kliniek en een eventueel bureau op in HealthTurkiye.',
        'Laat het aantal haarzakjes pas noemen na foto\'s van je donorgebied, niet als vast pakketgetal.',
        'Vraag naar resultaten van echte patiënten na 12 maanden, niet naar foto\'s van de eerste dagen.',
        'Vraag wat er gebeurt en wie betaalt als het misgaat, en vraag de complicatieverzekering op papier.'
      ] }
    ],
    faq: [
      { q: 'Wat kost een haartransplantatie in Turkije?', a: 'Historische internetaanbiedingen uit de EVZ-vergelijking van oktober 2024 bij gemiddeld haarverlies: ongeveer EUR 2.400 in Turkije en EUR 6.800 in Duitsland. Vraag een actuele gespecificeerde offerte. Vlucht en extra nachten komen erbij.' },
      { q: 'Wat kost een haartransplantatie in Nederland?', a: 'Een cosmetisch arts noemde in 2021 EUR 4.000 tot 7.000 voor het maximum van 3.500 haarzakjes. Alleen de haargrens is meestal goedkoper.' },
      { q: 'Is een haartransplantatie in Turkije veilig?', a: 'Een website kan niet vaststellen of een behandeling voor jou veilig is. Arts, locatie, ingreep en nazorg spelen allemaal mee. De ISHRS waarschuwt voor onbevoegde technici die opereren in plaats van artsen. Vraag schriftelijk wie wat doet en zoek de kliniek op in HealthTurkiye.' },
      { q: 'Wat veranderde er in Turkije in 2025?', a: 'Sinds de regeling van 26 april 2025 is een verzekering voor complicaties verplicht bij een operatie, en bemiddelaars hebben een vergunning en een callcenter dat dag en nacht bereikbaar is nodig.' }
    ],
    verwant: ['check-surgeon-turkey', 'nl/ooglidcorrectie-kosten']
  },
  'nl/ooglidcorrectie-kosten': {
    taal: 'nl', ingreep: 'eyelid', naar: 'home', alt: 'ooglid',
    title: 'Ooglidcorrectie kosten en vergoeding in 2026: zo zit het',
    h1: 'Ooglidcorrectie: wat het kost en wanneer je verzekering betaalt',
    desc: 'Wat een bovenooglidcorrectie kost, wanneer de basisverzekering betaalt (gezichtsveld), wat met je eigen risico gebeurt en welke aanvullende verzekering in 2027 dekt.',
    kort: 'Een bovenooglidcorrectie kost volgens Zorgwijzer rond EUR 700 per oog (tarieven 2026). De basisverzekering betaalt alleen als je ooglid je gezichtsveld ernstig beperkt, gemeten door een oogarts, of bij een aangeboren afwijking. Je hebt dan een verwijzing nodig en je eigen risico telt mee. [zorgwijzerOog] Doe je het voor je uiterlijk, dan betaal je alles zelf. Van DSW, Salland en Stad Holland dekt geen enkele aanvullende verzekering voor 2027 de ingreep. [consBondOog]',
    secties: [
      { h: 'Wat het kost', p: [
        'Zorgwijzer schat een bovenooglidcorrectie op rond EUR 700 per oog, volgens de tarieven van 2026. [zorgwijzerOog]',
        'De Consumentenbond meldt dat de prijs sterk per kliniek verschilt. De behandeling bestaat uit een consult, de ingreep en een controle. Vraag daarom altijd één totaalprijs op papier. [consBondOog]'
      ] },
      { h: 'Wanneer de basisverzekering betaalt', p: [
        'Alleen bij een medische reden. Er moet aan een van twee voorwaarden voldaan zijn: het bovenooglid is verslapt of verlamd door een afwijking die er vanaf de geboorte is, of het geeft een ernstige beperking van je gezichtsveld. Dat stelt een oogarts vast met een gezichtsveldonderzoek. [zorgwijzerOog]',
        'Zonder verwijzing van een arts heb je geen recht op vergoeding. De arts vraagt de behandeling aan bij je zorgverzekeraar en een medisch adviseur beslist. [zorgwijzerOog]',
        'Wordt het vergoed, dan telt het mee voor je eigen risico. Bij een cosmetische ingreep betaal je alles zelf en speelt het eigen risico geen rol. [zorgwijzerOog]'
      ] },
      { h: 'Onderooglid', p: [
        'Een onderooglidcorrectie voor je uiterlijk wordt niet vergoed. Is er een aandoening, dan kan het wel verzekerde zorg zijn. [zorgwijzerOog]'
      ] },
      { h: 'Aanvullende verzekering 2027', p: [
        'Van de eerste drie verzekeraars die hun polissen voor 2027 bekendmaakten (DSW, Salland en Stad Holland) biedt geen enkele een aanvullende verzekering die een bovenooglidcorrectie dekt. [consBondOog] Zorgwijzer noemt op zijn pagina over vergoeding in 2027 (bijgewerkt 16 november 2026) aanvullende polissen van IZA, IZZ, ONVZ, Umc, UnitedConsumers en VGZ die een ooglidcorrectie vergoeden, altijd alleen bij medische criteria. Een puur cosmetische correctie betaal je zelf. Controleer de voorwaarden bij je verzekeraar. [zorgwijzerOog] Zilveren Kruis geeft in 2027 in geen enkele aanvullende verzekering extra vergoeding; de basisverzekering betaalt een bovenooglidcorrectie alleen bij een ernstige beperking van het gezichtsveld. [zkPlast2027]'
      ] },
      { h: 'Zo vraag je vergoeding aan', l: [
        'Ga naar je huisarts als je bovenooglid over je wimpers hangt of je zicht belemmert.',
        'Laat bij de oogarts je gezichtsveld meten.',
        'De arts vraagt de behandeling aan bij je zorgverzekeraar; een medisch adviseur beslist.',
        'Krijg je geen vergoeding, vraag dan bij elke kliniek één totaalprijs op papier.'
      ] }
    ],
    faq: [
      { q: 'Wat kost een ooglidcorrectie?', a: 'Rond EUR 700 per oog voor een bovenooglidcorrectie, volgens Zorgwijzer (tarieven 2026). Klinieken verschillen sterk, vraag één totaalprijs.' },
      { q: 'Wanneer wordt een ooglidcorrectie vergoed?', a: 'Uit de basisverzekering alleen als je bovenooglid je gezichtsveld ernstig beperkt (vastgesteld door een oogarts) of bij een aangeboren afwijking, en met een verwijzing.' },
      { q: 'Telt een ooglidcorrectie mee voor het eigen risico?', a: 'Ja, als hij uit de basisverzekering wordt vergoed. Betaal je zelf, dan speelt het eigen risico geen rol.' },
      { q: 'Wordt een onderooglidcorrectie vergoed?', a: 'Niet als hij voor je uiterlijk is. Bij een aandoening kan het wel verzekerde zorg zijn.' },
      { q: 'Welke aanvullende verzekering vergoedt een ooglidcorrectie in 2027?', a: 'Van DSW, Salland, Stad Holland en Zilveren Kruis geen enkele. Zorgwijzer noemt aanvullende polissen van IZA, IZZ, ONVZ, Umc, UnitedConsumers en VGZ, maar alleen bij medische criteria. Een puur cosmetische correctie betaal je zelf.' }
    ],
    verwant: ['nl/haartransplantatie-turkije', 'eyelid-surgery-cost']
  },
  'de/haartransplantation-tuerkei': {
    taal: 'de', ingreep: 'hair', naar: 'turkey', alt: 'haar',
    title: 'Haartransplantation Türkei: echte Kosten und 5 Checks (2026)',
    h1: 'Haartransplantation in der Türkei: was sie wirklich kostet und wie Sie prüfen, wer operiert',
    desc: 'Preise Türkei gegen Deutschland, Polen und Ungarn vom EVZ, die ganze Reise in einer Summe, die türkischen Regeln von 2025 und fünf Checks vor der Buchung.',
    kort: 'Ein EVZ-Vergleich von Internetangeboten bei mittlerem Haarausfall, Stand Oktober 2024, nennt etwa 2.400 Euro in der Türkei und 6.800 Euro in Deutschland. Historische Beispiele, keine aktuellen Angebote. [evz] Arzt, Behandlungsort, Eingriff und Nachsorge müssen einzeln geprüft werden: Die ISHRS warnt, dass in vielen Kliniken Techniker statt Ärzte operieren. Lassen Sie sich schriftlich geben, welcher Arzt welchen Schritt macht, und prüfen Sie die Klinik im offiziellen Register HealthTurkiye. [ishrsBlack] [healthturkiye]',
    calc: { proc: 'Haartransplantation', abroad: { de: 2400 }, home: { de: 6800 }, nights: 3, extras: { de: 120 } },
    secties: [
      { h: 'Was es kostet', p: [
        'Das EVZ verglich Internetangebote bei mittlerem Haarausfall, Stand Oktober 2024: etwa 6.800 Euro in Deutschland, 5.200 Euro in Polen, 3.400 Euro in Ungarn und 2.400 Euro in der Türkei. [evz]',
        'Pakete in der Türkei enthalten meist den Eingriff, 2 bis 3 Hotelnächte, Transfers, einen Dolmetscher, Medikamente und die erste Haarwäsche. Flug, weitere Nächte und Reiseversicherung zahlen Sie meist extra.'
      ] },
      { h: 'Wer wirklich operiert', p: [
        'Die internationale Gesellschaft der Haarchirurgen ISHRS warnt vor einem Schwarzmarkt, in dem Techniker ohne Zulassung operieren, während der Arzt von der Website nicht im Raum ist. [ishrsBlack]',
        'In der ISHRS-Umfrage 2025 sagten 59% der Mitgliedsärzte, dass es in ihrer eigenen Stadt illegale Haarkliniken gibt. [ishrs2025]'
      ] },
      { h: 'Die türkischen Regeln seit 2025', p: [
        'Eine Verordnung vom 26. April 2025 ersetzte die Regeln von 2017. Kliniken für ausländische Patienten brauchen eine Lizenz, Vermittler eine USHAS-Lizenz und ein Callcenter rund um die Uhr in mindestens zwei Fremdsprachen, und eine Komplikationsversicherung ist bei Operationen Pflicht. [mondaqTr]',
        'HealthTurkiye ist das offizielle Register lizenzierter Kliniken und Vermittler. Einzelne Chirurgen stehen dort nicht, den Arzt prüfen Sie also selbst. [healthturkiye]'
      ] },
      { h: 'Fünf Checks vor der Buchung', l: [
        'Lassen Sie sich den Namen des Arztes für Entnahme und Einsetzen schriftlich geben.',
        'Suchen Sie Klinik und Vermittler in HealthTurkiye.',
        'Die Zahl der Grafts erst nach Fotos Ihres Spenderbereichs, nicht als feste Paketzahl.',
        'Fragen Sie nach Ergebnissen echter Patienten nach 12 Monaten.',
        'Fragen Sie, wer zahlt, wenn etwas schiefgeht, und lassen Sie sich die Komplikationsversicherung schriftlich geben.'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Haartransplantation in der Türkei?', a: 'Historische EVZ-Internetangebote bei mittlerem Haarausfall, Stand Oktober 2024: etwa 2.400 Euro in der Türkei und 6.800 Euro in Deutschland. Aktuelles Angebot einholen. Flug und weitere Nächte kommen dazu.' },
      { q: 'Ist eine Haartransplantation in der Türkei sicher?', a: 'Eine Website kann Ihre Behandlungssicherheit nicht feststellen. Arzt, Behandlungsort, Eingriff und Nachsorge sind zu prüfen. Die ISHRS warnt vor nicht befugten Technikern, die statt Ärzten operieren. Fragen Sie schriftlich, wer was macht, und prüfen Sie die Klinik in HealthTurkiye.' },
      { q: 'Was hat sich 2025 in der Türkei geändert?', a: 'Seit der Verordnung vom 26. April 2025 ist eine Komplikationsversicherung bei Operationen Pflicht, und Vermittler brauchen eine Lizenz und ein Callcenter rund um die Uhr.' }
    ],
    verwant: ['check-surgeon-turkey', 'hair-transplant-turkey']
  },
  'liposuction-cost': {
    taal: 'en', ingreep: 'lipo', naar: 'home', alt: 'lipo',
    title: 'Liposuction cost in 2026: surgeon fees and the full bill',
    h1: 'Liposuction cost: the surgeon fee, the full bill and when insurance pays',
    desc: 'ASPS surgeon fees for liposuction, what comes on top, prices in Germany and the Netherlands, and when insurance pays (lipoedema). With sources.',
    kort: 'The American Society of Plastic Surgeons gives an average surgeon fee of $4,711 for liposuction, and a 2024 range of $4,300 to $7,500. Anaesthesia, the operating room and other costs come on top. [aspsLipo] [aspsCost] Most health insurance does not pay for liposuction for looks. In Germany statutory insurance pays for liposuction for lipoedema in all stages, under strict conditions. [apoLipo]',
    secties: [
      { h: 'What it costs', p: [
        'ASPS average surgeon fee: $4,711. The fee is only part of the price: it does not include anaesthesia, the operating room or other related costs. [aspsLipo]',
        'ASPS now gives a range instead of one price: $4,300 to $7,500 for liposuction of the body in 2024, and $3,000 to $5,500 for liposuction of the chin. [aspsCost]',
        'Germany: on average EUR 2,500 to 7,000, according to the European Consumer Centre Germany (EVZ). [evzLipo]',
        'Netherlands: about EUR 1,000 to 2,000 per treatment, according to Geld.nl. [geldLipo]'
      ] },
      { h: 'What comes on top', l: [
        'Anaesthesia and the hospital or surgical facility.',
        'Medical tests, compression garments after surgery and medicine. [aspsLipo]',
        'A correction afterwards: ask in writing what that costs.'
      ] },
      { h: 'When insurance pays', p: [
        'US: most health insurance plans do not cover liposuction or its complications. [aspsLipo]',
        'Germany: since a decision of the Federal Joint Committee (G-BA) in 2025, statutory insurance pays for liposuction for lipoedema in all stages, in hospital and, since July 2026, as an outpatient. A specialist must diagnose lipoedema, your BMI should be under 35, your weight must be stable for six months and you must have had at least six months of conservative treatment such as compression. [apoLipo]',
        'Netherlands: insurance only pays when there is a medical need; liposuction for looks is never covered. If it is paid from basic insurance, your deductible (eigen risico) applies. [geldLipo] In May 2022 the Zorginstituut ruled that liposuction for lipoedema could not (yet) be added to the basic package, because the evidence was of very low quality. [zinLipo]'
      ] },
      { h: 'Going abroad for liposuction', p: [
        'EVZ says liposuction abroad is often up to two thirds cheaper than in Germany, with large differences between countries. Travel, the hotel and possible cancellation costs come on top, and a deposit you pay in advance may not be refunded. [evzLipo]',
        'For the risks of cosmetic surgery abroad and what complications cost at home, see our tummy tuck abroad guide.'
      ] }
    ],
    faq: [
      { q: 'How much does liposuction cost?', a: 'ASPS gives an average surgeon fee of $4,711 and a 2024 range of $4,300 to $7,500. Anaesthesia and the operating room come on top.' },
      { q: 'How much does liposuction cost in Germany?', a: 'On average EUR 2,500 to 7,000, according to the European Consumer Centre Germany.' },
      { q: 'Does insurance pay for liposuction?', a: 'Not when it is done for looks. In Germany statutory insurance pays for lipoedema in all stages under strict conditions; in the Netherlands only with a medical need.' },
      { q: 'Is liposuction cheaper abroad?', a: 'EVZ says often up to two thirds cheaper than in Germany, but travel, hotel and a deposit that may not come back are extra.' }
    ],
    verwant: ['nl/liposuctie-kosten', 'tummy-tuck-abroad-cost', 'eyelid-surgery-cost']
  },
  'nl/liposuctie-kosten': {
    taal: 'nl', ingreep: 'lipo', naar: 'home', alt: 'lipo',
    title: 'Liposuctie kosten en vergoeding in 2026: zo zit het',
    h1: 'Liposuctie: wat het kost en wanneer je verzekering betaalt',
    desc: 'Wat een liposuctie kost in Nederland, Duitsland en de VS, wanneer de verzekering betaalt (lipoedeem) en wat er in 2027 in de aanvullende verzekering zit.',
    kort: 'Een liposuctie kost in Nederland ongeveer EUR 1.000 tot 2.000 per behandeling, volgens Geld.nl. De verzekering betaalt alleen bij een medische noodzaak; een liposuctie voor je uiterlijk wordt nooit vergoed. [geldLipo] Van DSW, Salland en Stad Holland dekt geen enkele aanvullende verzekering voor 2027 plastische chirurgie. [consPlast]',
    secties: [
      { h: 'Wat het kost', p: [
        'Nederland: ongeveer EUR 1.000 tot 2.000 per behandeling, volgens Geld.nl. [geldLipo]',
        'Duitsland: gemiddeld EUR 2.500 tot 7.000, volgens het Europees Consumentencentrum in Duitsland (EVZ). [evzLipo]',
        'Verenigde Staten: de Amerikaanse vereniging van plastisch chirurgen ASPS noemt een gemiddeld honorarium van de chirurg van $4.711. Narcose, de operatiekamer en andere kosten komen daar nog bij. [aspsLipo]',
        'Vraag bij elke kliniek één totaalprijs op papier: chirurg, narcose, operatiekamer, drukkleding, controles en wat een correctie kost.'
      ] },
      { h: 'Wanneer de verzekering betaalt', p: [
        'Alleen bij een medische noodzaak, uit de basis- of de aanvullende verzekering. Wanneer dat precies zo is, staat niet exact in de polisvoorwaarden. Voor je uiterlijk wordt het nooit vergoed. [geldLipo]',
        'Wordt het uit de basisverzekering vergoed, dan telt het mee voor je eigen risico. Een wettelijke eigen bijdrage is er niet. [geldLipo]'
      ] },
      { h: 'Lipoedeem', p: [
        'Het Zorginstituut oordeelde in mei 2022 dat liposuctie bij lipoedeem (nog) niet in het basispakket kan, omdat het bewijs uit de studies van zeer lage kwaliteit was. Het adviseerde nieuw onderzoek. [zinLipo]',
        'In Duitsland betaalt de wettelijke verzekering sinds een besluit van 2025 wel een liposuctie bij lipoedeem in alle stadia, onder strenge voorwaarden: een diagnose door een specialist, een BMI onder 35, zes maanden een stabiel gewicht en minstens zes maanden behandeling met bijvoorbeeld compressie. [apoLipo]'
      ] },
      { h: 'Aanvullende verzekering 2027', p: [
        'Van de eerste verzekeraars met polissen voor 2027 (DSW, Salland en Stad Holland) heeft geen enkele een aanvullende verzekering die plastische chirurgie dekt. [consPlast] Nu alle polissen voor 2027 bekend zijn, heeft alleen ONVZ met Topfit nog een aanvullende verzekering die plastische chirurgie vergoedt, en dan alleen als het medisch noodzakelijk is. [geldPlast] Zilveren Kruis geeft in 2027 in geen enkele aanvullende verzekering extra vergoeding voor plastische chirurgie, en zet liposuctie van de buik bij wat niet vergoed wordt. [zkPlast2027]'
      ] },
      { h: 'Naar het buitenland', p: [
        'Volgens het EVZ is een liposuctie in het buitenland vaak tot twee derde goedkoper dan in Duitsland, met grote verschillen per land. Reis, hotel en mogelijke annuleringskosten komen erbij, en een aanbetaling krijg je soms niet terug. [evzLipo]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een liposuctie?', a: 'In Nederland ongeveer EUR 1.000 tot 2.000 per behandeling volgens Geld.nl. In Duitsland gemiddeld EUR 2.500 tot 7.000 volgens het EVZ.' },
      { q: 'Wordt liposuctie vergoed?', a: 'Alleen bij een medische noodzaak. Voor je uiterlijk nooit. Wordt het uit de basisverzekering vergoed, dan telt je eigen risico mee.' },
      { q: 'Wordt liposuctie bij lipoedeem vergoed?', a: 'Het Zorginstituut oordeelde in mei 2022 dat het (nog) niet in het basispakket kan. In Duitsland betaalt de wettelijke verzekering het sinds 2025 wel, onder strenge voorwaarden.' },
      { q: 'Welke aanvullende verzekering vergoedt liposuctie in 2027?', a: 'Alleen ONVZ Topfit vergoedt in 2027 plastische chirurgie uit een aanvullende verzekering, en alleen bij medische noodzaak. Liposuctie om er anders uit te zien vergoedt geen enkele verzekeraar.' }
    ],
    verwant: ['nl/ooglidcorrectie-kosten', 'de/fettabsaugung-kosten', 'liposuction-cost']
  },
  'de/fettabsaugung-kosten': {
    taal: 'de', ingreep: 'lipo', naar: 'home', alt: 'lipo',
    title: 'Fettabsaugung Kosten 2026: Bauch, Preise und Krankenkasse',
    h1: 'Fettabsaugung: was sie kostet und wann die Krankenkasse zahlt',
    desc: 'Was eine Fettabsaugung in Deutschland kostet, was dazukommt, wann die Krankenkasse beim Lipödem zahlt und was der Eingriff im Ausland kostet. Mit Quellen.',
    kort: 'Eine Fettabsaugung kostet in Deutschland laut Europäischem Verbraucherzentrum (EVZ) durchschnittlich 2.500 bis 7.000 Euro. [evzLipo] Aus ästhetischen Gründen zahlt die Krankenkasse nicht. Beim Lipödem ist die Fettabsaugung seit einem Beschluss des G-BA von 2025 in allen Stadien eine Kassenleistung, unter strengen Voraussetzungen, und seit Juli 2026 auch ambulant. [apoLipo]',
    secties: [
      { h: 'Was es kostet', p: [
        'Deutschland: durchschnittlich 2.500 bis 7.000 Euro, laut EVZ. [evzLipo]',
        'Zum Vergleich USA: Die amerikanische Gesellschaft der plastischen Chirurgen ASPS nennt ein durchschnittliches Chirurgenhonorar von 4.711 Dollar, ohne Narkose und OP-Saal. [aspsLipo]',
        'Lassen Sie sich einen Gesamtpreis schriftlich geben: Chirurg, Narkose, OP-Saal, Kompressionswäsche, Nachkontrollen und was eine Korrektur kostet.'
      ] },
      { h: 'Wann die Krankenkasse zahlt', p: [
        'Beim Lipödem ist die Fettabsaugung in allen Stadien unter bestimmten Voraussetzungen eine Kassenleistung, stationär und seit Juli 2026 auch ambulant. Das beschloss der G-BA 2025 auf Grundlage der Zwischenergebnisse der LIPLEG-Studie. [apoLipo]',
        'Die Voraussetzungen: Ein Facharzt stellt die Diagnose Lipödem. Der BMI sollte unter 35 liegen; zwischen 32 und 35 zählt zusätzlich das Verhältnis von Taille zu Körpergröße. Das Gewicht muss sechs Monate vor dem Eingriff stabil sein, und Sie müssen mindestens sechs Monate konsequent konservativ behandelt worden sein, zum Beispiel mit Kompression und Bewegung. [apoLipo]',
        'Bei einem BMI zwischen 35 und 40 kommt zuerst eine Behandlung zur Gewichtsabnahme, über 40 bewilligen die Kassen eine Liposuktion nur in seltenen Härtefällen. [apoLipo]',
        'In anderen Fällen entscheidet der Medizinische Dienst im Einzelfall. [evzLipo]'
      ] },
      { h: 'Was die Studie zeigte', p: [
        'Nach zwölf Monaten hatten 68,4 Prozent der operierten Frauen spürbar weniger Schmerzen. Bei rein herkömmlicher Behandlung waren es 7,6 Prozent. [apoLipo]'
      ] },
      { h: 'Fettabsaugung im Ausland', p: [
        'Laut EVZ liegen die Preise im Ausland oft bis zu zwei Drittel unter den deutschen Kosten, je nach Land und Region sehr unterschiedlich. Eine tschechische Klinik wirbt etwa mit 775 bis 2.250 Euro. [evzLipo]',
        'Dazu kommen Reise, Unterkunft und mögliche Stornokosten. Eine Anzahlung vor der Behandlung bekommen Sie unter Umständen nicht zurück. [evzLipo]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Fettabsaugung am Bauch?', a: 'In Deutschland kostet eine Fettabsaugung laut EVZ durchschnittlich 2.500 bis 7.000 Euro.' },
      { q: 'Zahlt die Krankenkasse eine Fettabsaugung?', a: 'Aus ästhetischen Gründen nicht. Beim Lipödem in allen Stadien unter strengen Voraussetzungen, seit Juli 2026 auch ambulant.' },
      { q: 'Welche Voraussetzungen gelten beim Lipödem?', a: 'Diagnose durch einen Facharzt, BMI unter 35, sechs Monate stabiles Gewicht und mindestens sechs Monate konservative Behandlung wie Kompression.' },
      { q: 'Ist eine Fettabsaugung im Ausland günstiger?', a: 'Laut EVZ oft bis zu zwei Drittel. Reise, Hotel und eine Anzahlung, die eventuell nicht zurückkommt, kommen dazu.' }
    ],
    verwant: ['liposuction-cost', 'nl/liposuctie-kosten', 'de/haartransplantation-tuerkei']
  },
  'breast-augmentation-cost': {
    taal: 'en', ingreep: 'breast', naar: 'home', alt: 'breast',
    title: 'Breast augmentation cost in 2026: fees and the full bill',
    h1: 'Breast augmentation cost: the surgeon fee, the full bill and later costs',
    desc: 'ASPS surgeon fees for breast augmentation, hospital prices in the Netherlands, what implant removal costs later and when insurance pays. With sources.',
    kort: 'The American Society of Plastic Surgeons gives an average cost of $4,875 for breast augmentation with implants and $5,719 with fat grafting. That is only part of the price: anaesthesia and the operating room come on top. [aspsBreast] Most health insurance does not pay for cosmetic breast augmentation, its complications or a revision. [aspsBreast]',
    secties: [
      { h: 'What it costs', p: [
        'ASPS average: $4,875 with implants and $5,719 with fat grafting, without anaesthesia, operating room or other costs. [aspsBreast]',
        'ASPS ranges for 2024 (surgeon fee): $4,575 to $8,000 with implants and $5,500 to $9,500 with fat grafting only. [aspsCost]',
        'Netherlands: about EUR 3,500 to 5,000, according to Geld.nl. [geldBorst] One Dutch hospital, Reinier de Graaf, lists EUR 5,200 with round implants, EUR 5,600 with anatomical implants and EUR 5,700 with fat (lipofilling) for 2026. [rdgf2026]',
        'Germany: EUR 4,000 to 7,000, according to Apotheken Umschau (article last updated 2017). [apoBrust]'
      ] },
      { h: 'Costs that can come later', p: [
        'At Reinier de Graaf in 2026, swapping both implants costs EUR 5,850. Removing one implant costs EUR 3,000, both EUR 4,250, both with the capsule EUR 5,500 and both with a breast lift EUR 7,200. [rdgf2026]',
        'In Germany a follow-up operation, for example for capsular contracture, can cost EUR 5,000 to 10,000. After a cosmetic augmentation you pay part of it yourself, even with statutory insurance. [vzhhImplant]',
        'Ask before you book what a revision or removal costs at that clinic, and whether it is in writing.'
      ] },
      { h: 'When insurance pays', p: [
        'US: most plans do not cover cosmetic breast augmentation, related complications or a revision surgery. [aspsBreast]',
        'Netherlands: basic insurance pays only with a medical indication, for example after a breast was removed because of breast cancer. Psychological or social suffering is not a medical indication. With uneven breasts the basic insurance does not pay for an augmentation, but it pays to reduce the larger breast if the difference is at least two cup sizes. [geldBorst]',
        'Dutch insurer Zilveren Kruis gives no extra cover for plastic surgery in any of its supplementary policies for 2027. [zkPlast2027]'
      ] }
    ],
    faq: [
      { q: 'How much does breast augmentation cost?', a: 'ASPS gives an average of $4,875 with implants and $5,719 with fat grafting, without anaesthesia and operating room. In the Netherlands about EUR 3,500 to 5,000 according to Geld.nl.' },
      { q: 'How much does it cost to remove breast implants?', a: 'At the Dutch Reinier de Graaf hospital in 2026: EUR 4,250 for both implants, EUR 5,500 with the capsule. ASPS gives a 2024 surgeon fee range of $3,650 to $6,500.' },
      { q: 'Does insurance pay for breast augmentation?', a: 'Not for looks. Most US plans also exclude complications and revisions. In the Netherlands basic insurance pays only with a medical indication, for example after breast cancer surgery.' },
      { q: 'What does a breast implant swap cost?', a: 'At Reinier de Graaf in 2026, EUR 5,850 for both sides.' }
    ],
    verwant: ['nl/borstvergroting-kosten', 'de/brustvergroesserung-kosten', 'tummy-tuck-abroad-cost']
  },
  'nl/borstvergroting-kosten': {
    taal: 'nl', ingreep: 'breast', naar: 'home', alt: 'breast',
    title: 'Borstvergroting kosten 2026: prijzen en vergoeding',
    h1: 'Borstvergroting: wat het kost en wanneer je verzekering betaalt',
    desc: 'Wat een borstvergroting kost in Nederland, wat verwijderen of wisselen van implantaten later kost en wanneer de verzekering in 2027 betaalt. Met bronnen.',
    kort: 'Een borstvergroting kost in Nederland ongeveer EUR 3.500 tot 5.000, volgens Geld.nl. [geldBorst] Het Reinier de Graaf ziekenhuis vraagt in 2026 EUR 5.200 met ronde en EUR 5.600 met anatomische implantaten. [rdgf2026] De basisverzekering betaalt alleen bij een medische indicatie, bijvoorbeeld na een borstamputatie door borstkanker. [geldBorst]',
    secties: [
      { h: 'Wat het kost', p: [
        'Nederland: ongeveer EUR 3.500 tot 5.000, volgens Geld.nl. [geldBorst]',
        'Reinier de Graaf (ziekenhuis in Delft), prijzen 2026: EUR 5.200 met ronde implantaten, EUR 5.600 met anatomische implantaten en EUR 5.700 met eigen vet (lipofilling). [rdgf2026]',
        'Verenigde Staten: de vereniging van plastisch chirurgen ASPS noemt gemiddeld $4.875 met implantaten en $5.719 met eigen vet. Narcose en operatiekamer komen daar nog bij. [aspsBreast]',
        'Vraag bij elke kliniek één totaalprijs op papier: chirurg, narcose, operatiekamer, implantaten, controles en wat een correctie kost.'
      ] },
      { h: 'Wat later kan komen', p: [
        'Reinier de Graaf, prijzen 2026: beide implantaten wisselen EUR 5.850. Eén implantaat verwijderen EUR 3.000, beide EUR 4.250, beide met kapsel EUR 5.500 en beide met een borstlift EUR 7.200. [rdgf2026]',
        'Moet een implantaat eruit om medische redenen en wil je een nieuw, dan betaal je daar bij dit ziekenhuis EUR 1.500 per prothese bij. [rdgf2026]'
      ] },
      { h: 'Wanneer de verzekering betaalt', p: [
        'Basisverzekering: alleen bij een medische indicatie, bijvoorbeeld na een amputatie van een borst door borstkanker. Psychisch of sociaal lijden telt niet als medische indicatie. Je hebt toestemming van je verzekeraar en een verwijzing van je huisarts of specialist nodig, en het telt mee voor je eigen risico. [geldBorst]',
        'Ongelijke borsten: geen vergoeding voor een vergroting, wel voor het verkleinen van de grootste borst als het verschil minstens twee cupmaten is. [geldBorst]',
        'Aanvullende verzekering: maar een paar verzekeraars vergoeden plastische chirurgie zonder medische indicatie, en dan nooit volledig: je betaalt zelf bij. [geldBorst]'
      ] },
      { h: 'Aanvullende verzekering 2027', p: [
        'Zilveren Kruis geeft in 2027 in geen enkele aanvullende verzekering extra vergoeding voor plastische chirurgie; alleen de basisverzekering bij medische noodzaak. [zkPlast2027] Van DSW, Salland en Stad Holland dekt ook geen enkele aanvullende verzekering plastische chirurgie. [consPlast] Nu alle polissen voor 2027 bekend zijn, heeft alleen ONVZ met Topfit nog een aanvullende verzekering die plastische chirurgie vergoedt, en dan alleen als het medisch noodzakelijk is. [geldPlast]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een borstvergroting?', a: 'In Nederland ongeveer EUR 3.500 tot 5.000 volgens Geld.nl. Het Reinier de Graaf ziekenhuis vraagt in 2026 EUR 5.200 met ronde en EUR 5.600 met anatomische implantaten.' },
      { q: 'Wordt een borstvergroting vergoed?', a: 'Alleen bij een medische indicatie, bijvoorbeeld na een borstamputatie door borstkanker. Psychisch of sociaal lijden telt niet. Het eigen risico geldt.' },
      { q: 'Wat kost het om borstimplantaten te laten verwijderen?', a: 'Bij Reinier de Graaf in 2026 EUR 4.250 voor beide implantaten, EUR 5.500 met kapsel en EUR 7.200 met een borstlift.' },
      { q: 'Welke aanvullende verzekering vergoedt een borstvergroting in 2027?', a: 'Voor een borstvergroting om er anders uit te zien geen enkele. Alleen ONVZ Topfit vergoedt in 2027 plastische chirurgie uit een aanvullende verzekering, en alleen bij medische noodzaak.' }
    ],
    verwant: ['nl/liposuctie-kosten', 'nl/ooglidcorrectie-kosten', 'breast-augmentation-cost']
  },
  'de/brustvergroesserung-kosten': {
    taal: 'de', ingreep: 'breast', naar: 'home', alt: 'breast',
    title: 'Brustvergrößerung Kosten 2026: Preise und Krankenkasse',
    h1: 'Brustvergrößerung: was sie kostet und wer Folgeoperationen zahlt',
    desc: 'Was eine Brustvergrößerung kostet, was ein Implantatwechsel später kostet, wann die Krankenkasse zahlt und was Sie bei Komplikationen selbst tragen.',
    kort: 'Eine Brustvergrößerung kostet in Deutschland laut Apotheken Umschau 4.000 bis 7.000 Euro. [apoBrust] Eine medizinisch nicht notwendige Brustvergrößerung zahlen Sie selbst. Muss später nachoperiert werden, zahlt die Krankenkasse erst, verlangt aber einen Eigenanteil. [vzhhImplant]',
    secties: [
      { h: 'Was es kostet', p: [
        'Deutschland: 4.000 bis 7.000 Euro, laut Apotheken Umschau (Artikel zuletzt 2017 aktualisiert). [apoBrust]',
        'Zum Vergleich Niederlande: Das Krankenhaus Reinier de Graaf in Delft verlangt 2026 5.200 Euro mit runden und 5.600 Euro mit anatomischen Implantaten. [rdgf2026]',
        'USA: Die amerikanische Gesellschaft der plastischen Chirurgen ASPS nennt durchschnittlich 4.875 Dollar mit Implantaten, ohne Narkose und OP-Saal. [aspsBreast]',
        'Lassen Sie sich einen Gesamtpreis schriftlich geben: Chirurg, Narkose, OP-Saal, Implantate, Nachkontrollen und was eine Korrektur kostet.'
      ] },
      { h: 'Folgeoperationen: wer zahlt', p: [
        'Eine Folgeoperation, etwa bei einer Kapselfibrose, kann 5.000 bis 10.000 Euro kosten. Die Krankenkasse übernimmt zunächst die Kosten und fordert dann einen Teil von Ihnen zurück, nach § 52 SGB V. Gegen einen zu hohen Bescheid können Sie Widerspruch einlegen. [vzhhImplant]',
        'Beispiel: Das Landessozialgericht Niedersachsen-Bremen bestätigte 2019 einen Eigenanteil von 1.300 Euro an einem Implantatwechsel, der insgesamt 6.400 Euro kostete. [vzhhImplant]',
        'Zum Vergleich: In den Niederlanden kostet ein Wechsel beider Implantate bei Reinier de Graaf 2026 5.850 Euro, das Entfernen beider Implantate 4.250 Euro. [rdgf2026]'
      ] },
      { h: 'Wann die Krankenkasse zahlt', p: [
        'Nur unter besonderen Voraussetzungen und bei medizinischer Notwendigkeit; eine Kostenübernahme ist nicht selbstverständlich. [apoBrust]',
        'Eine medizinisch nicht notwendige, ästhetische Brustvergrößerung zahlen Sie selbst; die Krankenkassen beteiligen sich daran nicht. [vzhhImplant]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Brustvergrößerung?', a: 'In Deutschland 4.000 bis 7.000 Euro laut Apotheken Umschau. In den USA nennt die ASPS durchschnittlich 4.875 Dollar ohne Narkose und OP-Saal.' },
      { q: 'Zahlt die Krankenkasse eine Brustvergrößerung?', a: 'Aus ästhetischen Gründen nicht. Nur bei medizinischer Notwendigkeit und unter besonderen Voraussetzungen.' },
      { q: 'Wer zahlt, wenn ein Brustimplantat raus muss?', a: 'Die Krankenkasse zahlt zunächst, verlangt nach einer ästhetischen Brustvergrößerung aber einen Eigenanteil nach § 52 SGB V. Eine Folgeoperation kann 5.000 bis 10.000 Euro kosten.' },
      { q: 'Was kostet ein Implantatwechsel?', a: 'Im niederländischen Krankenhaus Reinier de Graaf 2026 5.850 Euro für beide Seiten.' }
    ],
    verwant: ['breast-augmentation-cost', 'nl/borstvergroting-kosten', 'de/fettabsaugung-kosten']
  },
  'breast-reduction-cost': {
    taal: 'en', ingreep: 'breast-reduction', naar: 'home', alt: 'breast-reduction', published: '2026-11-17', updated: '2026-11-17',
    title: 'Breast reduction cost in 2026 and when insurance pays',
    h1: 'Breast reduction cost: the surgeon fee, the full bill and insurance',
    desc: 'ASPS surgeon fees for breast reduction, prices in the Netherlands and Germany, and the rules insurers use before they pay. Independent, with sources.',
    kort: 'The American Society of Plastic Surgeons gives an average cost of $7,800 for breast reduction in aesthetic patients. That is the surgeon fee only: anaesthesia, the operating room, tests, garments and medicine come on top. [aspsReduction] Unlike most cosmetic surgery, breast reduction is often covered by health insurance, but your surgeon may need approval from the insurer first. [aspsReduction]',
    secties: [
      { h: 'What it costs', p: [
        'ASPS average: $7,800 for aesthetic patients, without anaesthesia, hospital or surgical facility, medical tests, post surgery garments and prescriptions. [aspsReduction]',
        'ASPS ranges for 2024 (surgeon fee only): $7,000 to $12,500 for breast reduction, $6,500 to $11,000 for a breast lift and $5,000 to $9,000 for male breast reduction. [aspsCost]',
        'Netherlands: about EUR 4,000 to 6,000, according to Geld.nl. [geldVerklein]',
        'Germany: around EUR 4,000 to 7,500, according to the portal krankenhaus.de. [khVerklein]',
        'Ask every clinic for one total price in writing: surgeon, anaesthesia, operating room, garments, check-ups and the cost of a correction.'
      ] },
      { h: 'When insurance pays', p: [
        'US: breast reduction is often covered by health insurance, but the surgeon may need approval from your insurer. Copayments and deductibles still apply. [aspsReduction]',
        'Netherlands: basic insurance pays with a large cup size and proven physical complaints, and a BMI under 30 for a year. The cup size limits differ: Geld.nl names cup DD/E (cup C if you are shorter than 1.60 m), insurer Univé names cup E (cup D if you are shorter). [geldVerklein] [uniVerklein] You need a referral from your GP or specialist and the deductible (eigen risico) applies. [geldVerklein]',
        'Netherlands: you must first have tried other ways to ease the complaints, such as a supportive bra or physiotherapy. Lifting sagging breasts is not covered. [uniVerklein]',
        'Germany: the statutory insurer decides case by case after an application, and the Medical Service checks it. Most insurers want at least 500 grams removed per side or two cup sizes less. [verivoxVerklein]'
      ] }
    ],
    faq: [
      { q: 'How much does a breast reduction cost?', a: 'ASPS gives an average surgeon fee of $7,800 for aesthetic patients, without anaesthesia and operating room. In the Netherlands about EUR 4,000 to 6,000 according to Geld.nl.' },
      { q: 'Does insurance pay for a breast reduction?', a: 'Often, when there is a medical reason. In the US the surgeon may need approval from the insurer first. In the Netherlands basic insurance pays with a large cup size, proven physical complaints and a BMI under 30.' },
      { q: 'What does a breast lift cost compared to a reduction?', a: 'ASPS 2024 surgeon fee ranges: $6,500 to $11,000 for a breast lift and $7,000 to $12,500 for a breast reduction.' },
      { q: 'What does male breast reduction cost?', a: 'ASPS gives a 2024 surgeon fee range of $5,000 to $9,000 for gynecomastia surgery.' }
    ],
    verwant: ['nl/borstverkleining-kosten', 'de/brustverkleinerung-kosten', 'breast-augmentation-cost']
  },
  'nl/borstverkleining-kosten': {
    taal: 'nl', ingreep: 'breast-reduction', naar: 'home', alt: 'breast-reduction', published: '2026-11-17', updated: '2026-11-17',
    title: 'Borstverkleining kosten 2026: prijs en vergoeding',
    h1: 'Borstverkleining: wat het kost en wanneer de basisverzekering betaalt',
    desc: 'Wat een borstverkleining kost, bij welke cupmaat en BMI de basisverzekering betaalt, wat je zelf betaalt en wat aanvullend vergoedt in 2027. Met bronnen.',
    kort: 'Een borstverkleining kost in Nederland ongeveer EUR 4.000 tot 6.000, volgens Geld.nl. De basisverzekering betaalt bij een grote cupmaat met aantoonbare lichamelijke klachten en een BMI onder 30. Je betaalt dan je eigen risico, maar geen eigen bijdrage. [geldVerklein]',
    secties: [
      { h: 'Wat het kost', p: [
        'Nederland: ongeveer EUR 4.000 tot 6.000, volgens Geld.nl. [geldVerklein]',
        'Duitsland: rond EUR 4.000 tot 7.500, volgens het portaal krankenhaus.de. [khVerklein]',
        'Verenigde Staten: de vereniging van plastisch chirurgen ASPS noemt gemiddeld $7.800, alleen voor de chirurg. Narcose, operatiekamer, onderzoeken, kleding en medicijnen komen daar nog bij. [aspsReduction]',
        'Vraag bij elke kliniek één totaalprijs op papier: chirurg, narcose, operatiekamer, controles en wat een correctie kost.'
      ] },
      { h: 'Wanneer de basisverzekering betaalt', p: [
        'Je hebt een grote cupmaat en aantoonbare lichamelijke klachten, zoals aan rug, nek of schouders. Geld.nl noemt minimaal cup DD/E, of cup C als je korter bent dan 1,60 meter. [geldVerklein] Univé noemt minimaal cup E, of cup D als je kleiner bent dan 1,60 meter. [uniVerklein] Vraag de precieze grens dus aan je eigen verzekeraar.',
        'Je BMI moet een jaar lang onder 30 zijn. Bij 1,70 meter is dat hoogstens 86 kilo. [geldVerklein]',
        'Je moet eerst geprobeerd hebben de klachten op een andere manier te verhelpen, bijvoorbeeld met een steunbeha of fysiotherapie. Ingetrokken tepels corrigeren of hangende borsten liften wordt niet vergoed. [uniVerklein]',
        'Ongelijke borsten: de basisverzekering betaalt het verkleinen van de grootste borst als het verschil minstens twee cupmaten is. [geldVerklein]',
        'Je hebt een verwijzing van je huisarts of specialist nodig. Het eigen risico geldt, een eigen bijdrage niet. [geldVerklein]'
      ] },
      { h: 'Aanvullende verzekering', p: [
        'Een aanvullende verzekering vergoedt een borstverkleining nooit volledig. De hoogste vergoeding is iets meer dan EUR 1.000. [geldVerklein]',
        'In 2027 heeft alleen ONVZ met Topfit een aanvullende verzekering die plastische chirurgie vergoedt, en dan alleen als het medisch noodzakelijk is. [geldPlast]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een borstverkleining?', a: 'In Nederland ongeveer EUR 4.000 tot 6.000 volgens Geld.nl. Wordt hij vergoed uit de basisverzekering, dan betaal je alleen je eigen risico.' },
      { q: 'Wanneer wordt een borstverkleining vergoed?', a: 'Bij een grote cupmaat (vaak cup E, of cup D als je kleiner bent dan 1,60 meter) met aantoonbare lichamelijke klachten, een BMI onder 30 gedurende een jaar en een verwijzing. De grens verschilt per verzekeraar.' },
      { q: 'Moet ik eigen risico betalen voor een borstverkleining?', a: 'Ja, het eigen risico geldt. Een eigen bijdrage betaal je niet.' },
      { q: 'Vergoedt een aanvullende verzekering een borstverkleining?', a: 'Nooit volledig, hoogstens iets meer dan EUR 1.000 volgens Geld.nl. In 2027 vergoedt alleen ONVZ Topfit plastische chirurgie, en alleen bij medische noodzaak.' }
    ],
    verwant: ['nl/borstvergroting-kosten', 'nl/liposuctie-kosten', 'breast-reduction-cost']
  },
  'de/brustverkleinerung-kosten': {
    taal: 'de', ingreep: 'breast-reduction', naar: 'home', alt: 'breast-reduction', published: '2026-11-17', updated: '2026-11-17',
    title: 'Brustverkleinerung Kosten 2026: Preis und Krankenkasse',
    h1: 'Brustverkleinerung: was sie kostet und wann die Krankenkasse zahlt',
    desc: 'Was eine Brustverkleinerung kostet, welche Voraussetzungen die Krankenkasse stellt, wie der Antrag läuft und was die private Versicherung zahlt.',
    kort: 'Eine Brustverkleinerung kostet laut krankenhaus.de rund 4.000 bis 7.500 Euro. [khVerklein] Die gesetzliche Krankenkasse entscheidet im Einzelfall nach einem Antrag. Meist muss pro Seite mindestens 500 Gramm oder um zwei Körbchengrößen verkleinert werden. [verivoxVerklein]',
    secties: [
      { h: 'Was es kostet', p: [
        'Deutschland: rund 4.000 bis 7.500 Euro, laut dem Portal krankenhaus.de. [khVerklein] Selbstzahlerinnen müssen mit mehreren Tausend Euro rechnen. [apoVerklein]',
        'Zum Vergleich Niederlande: etwa 4.000 bis 6.000 Euro, laut Geld.nl. [geldVerklein]',
        'USA: Die amerikanische Gesellschaft der plastischen Chirurgen ASPS nennt durchschnittlich 7.800 Dollar, nur für den Chirurgen, ohne Narkose und OP-Saal. [aspsReduction]',
        'Lassen Sie sich einen Gesamtpreis schriftlich geben: Chirurg, Narkose, OP-Saal, Nachkontrollen und was eine Korrektur kostet.'
      ] },
      { h: 'Wann die Krankenkasse zahlt', p: [
        'Die Krankenkasse entscheidet für jeden Fall einzeln. Sie stellen vorher einen Antrag auf Kostenübernahme mit medizinischen Gründen, der Medizinische Dienst prüft ihn. Ein Attest vom Hausarzt allein reicht nicht. [verivoxVerklein]',
        'Meist muss die Brust pro Seite um mindestens 500 Gramm oder um zwei Körbchengrößen verkleinert werden. Medizinische Gründe sind etwa Rückenschmerzen, Nackenverspannungen, Haltungsschäden, Kopfschmerzen oder wiederkehrende Hautentzündungen unter der Brust. Psychische Gründe gelten nicht als Hauptgrund. [verivoxVerklein]',
        'Eine große Brust allein, ohne Begleiterkrankungen, ist in der Regel kein Grund für eine Kostenübernahme. Der erste Antrag wird oft abgelehnt. Widerspruch legen Sie schriftlich innerhalb eines Monats ein. [apoVerklein]'
      ] },
      { h: 'Private Krankenversicherung', p: [
        'Private Versicherer zahlen nur bei medizinischer Notwendigkeit, die Sie meist mit einem ärztlichen Gutachten nachweisen. Aus rein ästhetischen Gründen zahlen sie nie. [verivoxPkv]',
        'Bei starkem Übergewicht verlangen die Versicherer in der Regel zuerst eine Gewichtsabnahme. Probleme nach einer früheren Brustvergrößerung zahlt die private Versicherung grundsätzlich nicht. [verivoxPkv]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Brustverkleinerung?', a: 'Laut krankenhaus.de rund 4.000 bis 7.500 Euro. In den Niederlanden etwa 4.000 bis 6.000 Euro laut Geld.nl.' },
      { q: 'Wann zahlt die Krankenkasse eine Brustverkleinerung?', a: 'Nur bei medizinischen Gründen und nach einem Antrag, den der Medizinische Dienst prüft. Meist muss pro Seite mindestens 500 Gramm oder um zwei Körbchengrößen verkleinert werden.' },
      { q: 'Was tun, wenn die Krankenkasse ablehnt?', a: 'Der erste Antrag wird oft abgelehnt. Legen Sie innerhalb eines Monats schriftlich Widerspruch ein, am besten mit Stellungnahmen der behandelnden Ärzte.' },
      { q: 'Zahlt die private Krankenversicherung eine Brustverkleinerung?', a: 'Nur wenn sie medizinisch notwendig ist, meist nachgewiesen mit einem ärztlichen Gutachten. Rein ästhetisch nie.' }
    ],
    verwant: ['de/brustvergroesserung-kosten', 'de/fettabsaugung-kosten', 'breast-reduction-cost']
  }
};


// Chirurg controleren per bestemming
export const CHECK = {
  turkey: { land: 'Turkey', kort: 'HealthTurkiye lists licensed clinics and agencies, not surgeons. Check the clinic there, then ask for the named surgeon and check their specialist title with the Turkish Medical Association and the plastic surgery society TPRECD.', stappen: ['Find the clinic and agency on HealthTurkiye. [healthturkiye]', 'Ask for the full name of the operating surgeon in writing.', 'Check the specialist title with the Turkish Medical Association (ttb.org.tr) and membership of TPRECD (plastikcerrahi.org.tr).', 'Ask for the complication insurance that is mandatory for surgery since the April 2025 regulation. [mondaqTr]'], risico: ['The UK FCDO reports 7 British deaths after medical procedures in Turkey in 2025. [fcdoTr]', '87 cases of botulism followed intragastric botox for weight loss in Istanbul and Izmir in 2023. [ecdcBot]'] },
  mexico: { land: 'Mexico', kort: 'A Mexican plastic surgeon needs a specialist licence (cedula de especialista) and certification by the Consejo Mexicano de Cirugia Plastica (CMCPER). One surgeon claimed in 2025 that only about 2,690 of those operating are certified.', stappen: ['Look up the cedula de especialista on cedulaprofesional.sep.gob.mx.', 'Check CMCPER certification on cmcper.org.mx.', 'Ask who gives the anaesthesia and where you go if something goes wrong.', 'Complaints go to CONAMED. [conamed]'], risico: ['12 patients died of fungal meningitis after epidurals in two clinics in Matamoros in 2023. [cidrap]', 'Claim: about 2,690 certified plastic surgeons against about 25,000 non-specialists doing cosmetic surgery (one surgeon, Oct 2025). [mxSpec]'] },
  colombia: { land: 'Colombia', kort: 'Check the surgeon in the national register ReTHUS and membership of the plastic surgery society SCCP, then check that the clinic is licensed (habilitada) and has an anaesthesiologist present.', stappen: ['Check registration in ReTHUS. [colombiaCheck]', 'Check SCCP membership (cirugiaplastica.org.co).', 'Ask for the clinic\'s habilitacion and the surgeon\'s liability insurance.', 'Under 18s may not have cosmetic surgery (Law 1799 of 2016). [ley1799]'], risico: ['Antioquia counted 125 serious complications from illegal procedures in January to October 2024, and at least 14 deaths. [antioquia]'] },
  'dominican-republic': { land: 'Dominican Republic', kort: 'Choose a surgeon certified by SODOCIPRE, the Dominican plastic surgery society. Since 2019 the health ministry limits operations to two major procedures at a time.', stappen: ['Check SODOCIPRE certification (sodocipre.net). [sodocipre]', 'Refuse a package with more than two major procedures in one operation. [cdcDr]', 'Ask where you recover: a recovery house is not a hospital.'], risico: ['93 US citizens died after cosmetic surgery in the Dominican Republic from 2009 to 2022 (CDC). [cdcDr]', '82.7% of 214 US-treated cosmetic tourism complications came from the Dominican Republic. [springerDr]'] },
  thailand: { land: 'Thailand', kort: 'The Thai Medical Council has a public doctor check that shows licence, specialty and any suspension. Thailand has about 60 JCI-accredited hospitals.', stappen: ['Look up the doctor on checkmd.tmc.or.th. [thaiCheck]', 'Prefer a hospital with JCI or national HA accreditation. [thaiJci]', 'Australians: Medicare does not cover you overseas. [smartraveller]'], risico: ['At one Brisbane hospital, 6 of 8 patients treated for complications of overseas breast implants had been operated in Thailand. [rbwh]'] },
  'south-korea': { land: 'South Korea', kort: 'Korea has no public list of doctors. Ask for the specialist certificate and check membership of the Korean Society of Plastic and Reconstructive Surgeons. You can ask for CCTV recording in the operating room.', stappen: ['Ask for the board certificate in plastic surgery.', 'Check KSPRS membership (plasticsurgery.or.kr).', 'Ask for CCTV recording during surgery under anaesthesia: mandatory on request since 2023. [koreaCctv]'], risico: ['1.17 million foreign patients came to Korea in 2024, 11.4% for plastic surgery. [koreaVol]', 'In 2025 the number rose to 2,011,822 foreign patients, of whom 233,100 (11.2%) came for plastic surgery. [sedKorea]'] }
};


// Only pages whose sourced text changed receive this modification date.
for (const page of Object.values(PAGES)) if (['hair','lipo'].includes(page.ingreep)) page.updated = '2026-11-15';

// 17 nov 2026: aanvullende dekking 2027 bijgewerkt op deze pagina's.
for (const slug of ['nl/liposuctie-kosten', 'nl/ooglidcorrectie-kosten', 'nl/borstvergroting-kosten']) PAGES[slug].updated = '2026-11-17';

// 17 nov 2026 (Henkjan: "Ja bouw"): twee gidsen waar vraag is en wij nog geen eigen pagina hadden (Demand Radar NL 16 nov:
// brazilian butt lift 27.100 en staaroperatie 9.900 zoekopdrachten per maand). Elk getal is op 17 november 2026 op de bronpagina
// zelf gelezen. Waar bronnen elkaar tegenspreken staan beide cijfers er met hun bron.
Object.assign(SRC, {
  bblAsps23: { t: 'ASPS: average surgeon fees for cosmetic procedures 2023', u: 'https://plasticsurgery.org/Documents/News/Statistics/2023/cosmetic-procedures-average-cost-2023.pdf' },
  bblAspsCost: { t: 'ASPS: buttock enhancement cost', u: 'https://www.plasticsurgery.org/cosmetic-procedures/buttock-enhancement/cost' },
  bblNhsFat: { t: 'NHS: surgical fat transfer (reviewed 19 October 2023)', u: 'https://www.nhs.uk/conditions/cosmetic-treatments/surgical-fat-transfer/' },
  bblNhsEng: { t: 'NHS England: warning about cheap BBLs abroad (December 2024)', u: 'https://www.england.nhs.uk/2024/12/nhs-warns-of-bargain-basement-bbls-in-run-up-to-christmas/' },
  bblNos: { t: 'NOS: billenoperaties in het buitenland (26 januari 2022)', u: 'https://nos.nl/l/2414656' },
  bblMofid: { t: 'Mofid et al., Aesthetic Surgery Journal 2017: report on mortality from gluteal fat grafting', u: 'https://academic.oup.com/asj/article/37/7/796/3075249' },
  bblAdvies: { t: 'Inter-society task force (ASPS, ASAPS, ISAPS, ISPRES, IFATS): gluteal fat grafting advisory, 31 January 2018', u: 'https://www.plasticsurgery.org/documents/Health-Policy/Patient-Safety/Gluteal-Fat-Grafting-2019.pdf' },
  bblAdvies2: { t: 'Multi-society task force: gluteal fat grafting safety advisory (July 2018)', u: 'https://plasticsurgery.org/documents/patient-safety/BBL/Gluteal-Fat-Grafting-Safety-Advisory_Jul18.pdf' },
  bblBaaps18: { t: 'BAAPS: The Bottom Line (4 October 2018)', u: 'https://baaps.org.uk/media/press_releases/1630/the_bottom_line' },
  bblBaaps22: { t: 'BAAPS: Bottoms Up (October 2022)', u: 'https://baaps.org.uk/about/news/1865/bottoms_up' },
  bblBaapsReview: { t: 'BAAPS: gluteal fat grafting safety review and recommendations (30 September 2022)', u: 'https://baaps.org.uk/_userfiles/pages/files/baaps_document_on_gluteal_lipofilling_safety_and_recommendations_final_1.pdf' },
  bblFlorida: { t: 'Florida Statutes s. 458.328: office surgeries, gluteal fat grafting', u: 'https://m.flsenate.gov/Statutes/458.328' },
  bblCdc: { t: 'CDC MMWR 25 January 2024: deaths of US citizens after cosmetic surgery in the Dominican Republic, 2009 to 2022', u: 'https://www.cdc.gov/mmwr/volumes/73/wr/mm7303a3.htm' },
  bblFcdo: { t: 'GOV.UK: Turkey travel advice, health', u: 'https://www.gov.uk/foreign-travel-advice/turkey/health' },
  bblTravelAware: { t: 'GOV.UK Travel Aware: surgery abroad', u: 'https://travelaware.campaign.gov.uk/surgery-abroad-cut-out-the-risk/' },
  bblNhsAbroad: { t: 'NHS: cosmetic surgery abroad (reviewed 14 December 2022)', u: 'https://www.nhs.uk/conditions/cosmetic-procedures/cosmetic-surgery-abroad/' },
  bblRijk: { t: 'Rijksoverheid: cosmetische ingreep in het buitenland', u: 'https://www.rijksoverheid.nl/vraag-en-antwoord/cosmetische-ingrepen/cosmetische-ingreep-buitenland' },
  bblRijkVerg: { t: 'Rijksoverheid: wanneer betaalt mijn zorgverzekeraar een cosmetische ingreep', u: 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/cosmetische-ingrepen/wanneer-betaalt-mijn-zorgverzekeraar-de-kosten-van-mijn-cosmetische-ingreep' },
  bblAA: { t: 'Auswärtiges Amt: Türkei, Reise- und Sicherheitshinweise', u: 'https://www.auswaertiges-amt.de/de/reiseundsicherheit/tuerkeisicherheit/201962' },
  bblVz: { t: 'Verbraucherzentrale: Schönheitsoperationen, Krankenkassen übernehmen nur selten die Kosten (14. September 2026)', u: 'https://www.verbraucherzentrale.de/wissen/gesundheit-pflege/aerzte-und-kliniken/schoenheitsoperationen-krankenkassen-uebernehmen-nur-selten-die-kosten-13852' },
  bblHerstel: { t: 'ASPS: buttock enhancement recovery', u: 'https://www.plasticsurgery.org/cosmetic-procedures/buttock-enhancement/recovery' },
  bblBig: { t: 'Rijksoverheid: mag mijn behandelaar de cosmetische ingreep uitvoeren (BIG-register)', u: 'https://www.rijksoverheid.nl/onderwerpen/cosmetische-ingrepen/vraag-en-antwoord/mag-mijn-behandelaar-de-cosmetische-ingreep-uitvoeren' },
  bblAbps: { t: 'American Board of Plastic Surgery: verify certification', u: 'https://abplasticsurgery.org/public/verify-certification/' },
  bblDgpraec: { t: 'DGPRÄC: Checkliste Arztsuche', u: 'https://www.dgpraec.de/wp-content/uploads/2018/03/Arztsuche_Checkliste.pdf' },
  bblGmc: { t: 'GMC: find a doctor\'s record', u: 'https://www.gmc-uk.org/registration-and-licensing/our-registers/a-guide-to-the-medical-register/find-a-doctors-record' },
  staarER: { t: 'Rijksoverheid: eigen risico zorgverzekering (gewijzigd 12 november 2026)', u: 'https://www.rijksoverheid.nl/documenten/vraag-en-antwoord/zorgverzekering/eigen-risico-zorgverzekering' },
  staarZK: { t: 'Zilveren Kruis: krijg ik een staaroperatie vergoed', u: 'https://www.zilverenkruis.nl/consumenten/vergoedingen/krijg-ik-een-staaroperatie-vergoed' },
  staarZin: { t: 'Zorginstituut (CVZ): standpunt multifocale en accommoderende lenzen bij staaroperatie, 26 oktober 2011', u: 'https://zorginstituutnederland.nl/binaries/zinl/documenten/standpunten/2011/10/26/multifocale-en-accomoderende-lenzen-bij-staaroperatie/Multifocale+en+accomoderende+lenzen+bij+staaroperatie.pdf' },
  staarJbz: { t: 'Jeroen Bosch Ziekenhuis: lensopties bij een staaroperatie (eigen prijzen, 16 september 2026)', u: 'https://www.jeroenboschziekenhuis.nl/behandelingen/lensopties-bij-een-staaroperatie/pdf' },
  staarAsz: { t: 'Albert Schweitzer ziekenhuis: keuze implantlens bij een staaroperatie (eigen prijzen, augustus 2026)', u: 'https://www.asz.nl/folders/oog_125/keuze-implantlens-bij-een-staaroperatie.pdf' },
  staarNog: { t: 'Nederlands Oogheelkundig Gezelschap: resultaten cataractregistratie 2025 (16 juni 2026)', u: 'https://www.oogheelkunde.org/wp-content/uploads/2026/07/2025-Infographic-Resultaten-Cataractregistratie-Patient.pdf' },
  staarTwee: { t: 'Zorginstituut Nederland: factsheet tweezijdige staaroperatie (december 2023)', u: 'https://www.zorginstituutnederland.nl/binaries/zinl/documenten/publicatie/2023/12/18/tweezijdige-staaroperatie/Factsheet+-+13.+PZp.+Tweezijdige+staaroperatie.pdf' },
  staarBicat: { t: 'Richtlijn Cataract, module BICAT (Federatie Medisch Specialisten, 9 mei 2025)', u: 'https://richtlijnendatabase.nl/richtlijn/cataract/bicat.html' },
  staarEndo: { t: 'Richtlijn Cataract, module antibioticaprofylaxe (15 december 2021)', u: 'https://richtlijnendatabase.nl/richtlijn/cataract/infectieprofylaxe_bij_cataract/per-_en_postoperatieve_antibiotica_profylaxe_bij_cataract.html' },
  staarTreek: { t: 'NZa: Regeling wachttijden en wachttijdbemiddeling medisch-specialistische zorg (Staatscourant 2021, 29132)', u: 'https://zoek.officielebekendmakingen.nl/stcrt-2021-29132.pdf' },
  staarWacht: { t: 'ZorgkaartNederland: wachttijden oogheelkunde, staar (bron NZa)', u: 'https://www.zorgkaartnederland.nl/wachttijden/oogheelkunde-staar' },
  staarAntonius: { t: 'St. Antonius Ziekenhuis: nazorg na een staaroperatie (11 november 2026)', u: 'https://www.antoniusziekenhuis.nl/nazorg-na-een-staaroperatie/pdf_download' },
  staarKeuze: { t: 'Keuzekaart Staar (Thuisarts.nl, Kennisinstituut Federatie Medisch Specialisten)', u: 'https://www.thuisarts.nl/file/3044/download' },
  staarVz: { t: 'Verbraucherzentrale: Grauer Star, Operation und Sonderlinsen (Stand 16. November 2026)', u: 'https://www.verbraucherzentrale.de/node/12878' },
  staarIqwig: { t: 'IQWiG gesundheitsinformation.de: Operation des Grauen Stars (aktualisiert 7. Januar 2026)', u: 'https://www.gesundheitsinformation.de/operation-des-grauen-stars.html' },
  staarDog: { t: 'DOG: Pressemitteilung Grauer Star, Kongress 2024', u: 'https://dog.org/wp-content/uploads/sites/11/2024/10/PM_DOG_2024_Grauer-Star_F.pdf' },
  staarAu: { t: 'Apotheken Umschau (dpa): Sonderlinsen bei Grauem Star (30. September 2021)', u: 'https://www.apotheken-umschau.de/krankheiten-symptome/augenkrankheiten/lohnen-sonderlinsen-bei-op-von-grauem-star-808835.html' },
  staarNhs: { t: 'NHS: cataract surgery (reviewed 6 March 2025)', u: 'https://www.nhs.uk/tests-and-treatments/cataract-surgery/' },
  staarWhich: { t: 'Which?: private cataract surgery costs (21 October 2026)', u: 'https://www.which.co.uk/reviews/private-healthcare/article/private-cataract-surgery-costs-aQfF44q2Gxjt' },
  staarMedicare: { t: 'Medicare.gov: cataract surgery coverage', u: 'https://www.medicare.gov/coverage/cataract-surgery' },
  staarFr: { t: 'Federal Register: Medicare Part B premium and deductible for 2026 (19 November 2025)', u: 'https://www.govinfo.gov/content/pkg/FR-2025-11-19/html/2025-20251.htm' },
  staarAao: { t: 'American Academy of Ophthalmology: choosing an artificial lens for cataract surgery', u: 'https://aao.org/eye-health/treatments/best-artificial-lens-IOL-cataract-surgery' },
  staarAaoHerstel: { t: 'American Academy of Ophthalmology: exercise and driving after cataract surgery', u: 'https://aao.org/eye-health/tips-prevention/safe-exercise-driving-cataract-surgery-recovery' },
  staarRco: { t: 'Royal College of Ophthalmologists: National Ophthalmology Database cataract audit (22 July 2025)', u: 'https://www.rcophth.ac.uk/?p=17314' }
});
Object.assign(PAGES, {
  'brazilian-butt-lift-cost-risks': {
    taal: 'en', ingreep: 'bbl', naar: 'home', alt: 'bbl',
    title: 'Brazilian butt lift: cost, death risk and safety rules',
    h1: 'Brazilian butt lift: what it costs, how risky it is and what to check',
    desc: 'BBL surgeon fees in the US and UK, the death risk in the published studies, the rule that fat stays under the skin, and how to check a surgeon. With sources.',
    kort: 'In the US the average surgeon fee for a Brazilian butt lift was $7,264 in 2023; anesthesia and the operating room come on top. [bblAsps23] [bblAspsCost] The NHS says a BBL has the highest death rate of all cosmetic procedures. [bblNhsFat] Surgical societies say fat may only go under the skin, never into the muscle. [bblAdvies2]',
    secties: [
      { h: 'What it costs', p: [
        'United States: the American Society of Plastic Surgeons (ASPS) gives an average surgeon fee of $7,264 for buttock augmentation with fat grafting in 2023, up from $6,083 the year before. [bblAsps23] That excludes anesthesia, operating room facilities and other related expenses. [bblAspsCost]',
        'United Kingdom: the NHS says a surgical fat transfer usually costs between £3,000 and £8,000. Consultations, aftercare and extra sessions may cost more. That figure covers fat transfer in general, not only the buttocks. [bblNhsFat]',
        'Abroad: NHS England says a BBL abroad can cost up to 70% less than in the UK, and that some packages with flights and hotel cost under £3,000. It published those figures as a warning, not as advice. [bblNhsEng]'
      ] },
      { h: 'How risky it is', p: [
        'In a 2017 survey for the Aesthetic Surgery Education and Research Foundation, 692 surgeons reported 198,857 gluteal fat grafting cases with 32 deaths from fat embolism in the lungs. The authors put the death rate between 1 in 6,214 and 1 in 2,351. [bblMofid]',
        'In January 2018 a task force of five surgical societies called the death rate "approximately 1/3000", the highest for any aesthetic procedure. [bblAdvies]',
        'A 2022 review by the British association BAAPS cites a follow-up survey from 2019 that found 1 death in 14,952, after surgeons stopped injecting into the muscle. BAAPS puts the actual risk nearer 1 in 15,000. [bblBaapsReview]'
      ] },
      { h: 'The rule that matters: fat under the skin only', p: [
        'The task force concluded that fat should only be placed in the tissue under the skin and never in the muscle. In every death it reviewed, the autopsy showed fat inside the gluteal muscle. [bblAdvies2]',
        'BAAPS advised its members in October 2018 not to perform the operation until more data was available. [bblBaaps18] In October 2022 it said no to BBL but yes to superficial gluteal lipofilling: fat only under the skin, with ultrasound during the operation to keep the cannula out of the muscle. [bblBaaps22] Its review says ultrasound must be used and recommends at most three cases per surgeon per day. [bblBaapsReview]',
        'Florida wrote this into law: fat only in the layer under the skin, ultrasound guidance, an in-person examination no later than the day before, and one surgeon for one patient at a time. [bblFlorida]'
      ] },
      { h: 'Surgery abroad', p: [
        'The CDC counted 93 US citizens who died after cosmetic surgery in the Dominican Republic between 2009 and 2022, rising from 4.1 a year in 2009 to 2018 to 13.0 a year in 2019 to 2022. Of 24 deaths it reviewed in detail, 22 followed gluteal fat transfer, and 11 of 20 autopsies showed fat embolism. All 24 patients had at least two procedures in one operation. [bblCdc]',
        'The UK Foreign Office says it is aware of 7 British nationals who died in Turkey in 2025 following medical procedures. [bblFcdo] UK government advice is to plan to stay in the country at least 10 days after general anesthesia, and it warns that most travel insurance does not cover planned treatment abroad. [bblTravelAware]',
        'The NHS advises not to fly for 5 to 7 days after liposuction and says overseas clinics may not provide follow-up treatment. [bblNhsAbroad]'
      ] },
      { h: 'Recovery', p: [
        'ASPS says to avoid prolonged sitting for about two weeks (some surgeons prefer longer), to wear a support garment around the clock, and to resume exercise after six to eight weeks. [bblHerstel]',
        'According to the NHS about 50% of the injected fat does not survive, and the result can take up to 6 months to show. [bblNhsFat]'
      ] },
      { h: 'How to check the surgeon', p: [
        'United States: verify board certification in plastic surgery with the American Board of Plastic Surgery. [bblAbps] United Kingdom: look the doctor up on the GMC register and check for a place on the specialist register for plastic surgery. [bblGmc]',
        'Ask four things in writing: where exactly the fat goes (under the skin only), whether ultrasound is used during the injection, how many of these operations the surgeon does in a day, and who treats a complication once you are home.'
      ] }
    ],
    faq: [
      { q: 'How much does a BBL cost?', a: 'In the US the average surgeon fee was $7,264 in 2023 according to ASPS, without anesthesia and operating room. In the UK the NHS gives £3,000 to £8,000 for a surgical fat transfer.' },
      { q: 'How dangerous is a BBL?', a: 'A 2018 task force of surgical societies put the death rate at about 1 in 3,000. A 2019 follow-up survey cited by BAAPS found 1 in 14,952 after surgeons stopped injecting into the muscle.' },
      { q: 'What makes a BBL safer?', a: 'Fat placed only under the skin and never in the muscle, ultrasound during the injection, and a surgeon who does few of these operations in a day. These are the recommendations of the surgical societies and of BAAPS.' },
      { q: 'How long can you not sit after a BBL?', a: 'ASPS says to avoid prolonged sitting for about two weeks; some surgeons ask for longer.' }
    ],
    verwant: ['liposuction-cost', 'tummy-tuck-abroad-cost', 'nl/brazilian-butt-lift-kosten-risico'], updated: '2026-11-17'
  },
  'nl/brazilian-butt-lift-kosten-risico': {
    taal: 'nl', ingreep: 'bbl', naar: 'home', alt: 'bbl',
    title: 'Brazilian butt lift: kosten, risico en waar je op let',
    h1: 'Brazilian butt lift: wat het kost, hoe gevaarlijk het is en wat je controleert',
    desc: 'Wat een Brazilian butt lift kost, hoe groot het risico op overlijden is volgens de studies, waarom vet alleen onder de huid mag en hoe je een chirurg controleert.',
    kort: 'Een Brazilian butt lift kost in Nederland rond de EUR 6.000 en wordt hier weinig gedaan, meldde de NOS in 2022. [bblNos] Je verzekering betaalt een cosmetische ingreep niet. [bblRijkVerg] Volgens de Britse NHS heeft de BBL het hoogste sterftecijfer van alle cosmetische ingrepen. [bblNhsFat] Chirurgenverenigingen zeggen: vet alleen onder de huid, nooit in de spier. [bblAdvies2]',
    secties: [
      { h: 'Wat het kost', p: [
        'Nederland: rond de EUR 6.000, volgens de NOS in januari 2022. De ingreep wordt in Nederland weinig gedaan. Een prijs van een onafhankelijke instantie hebben we niet gevonden. [bblNos]',
        'Verenigde Staten: de vereniging van plastisch chirurgen ASPS noemt een gemiddeld honorarium van de chirurg van $7.264 in 2023. [bblAsps23] Narcose, de operatiekamer en andere kosten komen daar nog bij. [bblAspsCost]',
        'Verenigd Koninkrijk: de NHS noemt GBP 3.000 tot 8.000 voor een chirurgische vettransplantatie in het algemeen. [bblNhsFat] In het buitenland kan het volgens NHS England tot 70% goedkoper zijn; het noemde dat cijfer in een waarschuwing. [bblNhsEng]'
      ] },
      { h: 'Vergoeding', p: [
        'Een cosmetische ingreep die medisch niet nodig is, krijg je niet vergoed. [bblRijkVerg] Plastische chirurgie om cosmetische redenen valt niet onder de basisverzekering. [consPlast]'
      ] },
      { h: 'Hoe gevaarlijk het is', p: [
        'In een enquête uit 2017 meldden 692 chirurgen 198.857 ingrepen met 32 sterfgevallen door een vetembolie in de longen. De onderzoekers schatten de sterfte tussen 1 op 6.214 en 1 op 2.351. [bblMofid]',
        'Een werkgroep van vijf internationale chirurgenverenigingen noemde in januari 2018 ongeveer 1 op 3.000, het hoogste cijfer van alle esthetische ingrepen. [bblAdvies]',
        'De Britse vereniging BAAPS haalt in 2022 een vervolgenquête uit 2019 aan die op 1 op 14.952 uitkwam, nadat chirurgen waren gestopt met injecteren in de spier. Zij schat het werkelijke risico op ongeveer 1 op 15.000. [bblBaapsReview]'
      ] },
      { h: 'De regel waar het om draait: vet alleen onder de huid', p: [
        'De werkgroep concludeerde dat vet alleen in het weefsel onder de huid mag komen en nooit in de spier. Bij elk sterfgeval dat zij bekeek, zat er vet in de bilspier. [bblAdvies2]',
        'BAAPS raadde haar leden in oktober 2018 af de ingreep te doen tot er meer gegevens waren. [bblBaaps18] Sinds oktober 2022 zegt zij: geen BBL, wel oppervlakkige lipofilling van de billen, met echografie tijdens de ingreep zodat de canule uit de spier blijft. [bblBaaps22] Zij adviseert hoogstens drie van deze ingrepen per chirurg per dag. [bblBaapsReview]',
        'In Florida staat het in de wet: vet alleen onder de huid, echografie verplicht, een onderzoek door de arts uiterlijk de dag ervoor en één arts voor één patiënt tegelijk. [bblFlorida]'
      ] },
      { h: 'Naar het buitenland', p: [
        'Voor een cosmetische ingreep in het buitenland ben je zelf verantwoordelijk. Buitenlandse aanbieders vallen niet onder de Nederlandse wet en de inspectie (IGJ) houdt alleen toezicht in Nederland. [bblRijk]',
        'De Amerikaanse gezondheidsdienst CDC telde 93 Amerikanen die tussen 2009 en 2022 overleden na een cosmetische operatie in de Dominicaanse Republiek. Van 24 sterfgevallen die het in detail bekeek, volgden er 22 op een vettransplantatie naar de billen. Alle 24 patiënten kregen minstens twee ingrepen in één operatie. [bblCdc]',
        'Het Britse ministerie van Buitenlandse Zaken weet van 7 Britten die in 2025 in Turkije overleden na een medische ingreep. [bblFcdo] Het adviseert na een narcose minstens 10 dagen in het land te blijven. [bblTravelAware]'
      ] },
      { h: 'Herstel', p: [
        'ASPS: ongeveer twee weken niet lang zitten (sommige chirurgen vragen langer), dag en nacht drukkleding en na zes tot acht weken weer sporten. [bblHerstel]',
        'Volgens de NHS overleeft ongeveer 50% van het ingespoten vet niet en kan het tot 6 maanden duren voor je het resultaat ziet. [bblNhsFat]'
      ] },
      { h: 'Zo controleer je de chirurg', p: [
        'In Nederland zoek je de arts op in het BIG-register: daar staat het specialisme en of er een maatregel is opgelegd. Een registratie zegt niets over ervaring met deze ene ingreep. [bblBig]',
        'Vraag vier dingen op papier: waar het vet precies komt (alleen onder de huid), of er echografie wordt gebruikt tijdens het inspuiten, hoeveel van deze ingrepen de chirurg op een dag doet en wie een complicatie behandelt als je weer thuis bent.'
      ] }
    ],
    faq: [
      { q: 'Wat kost een Brazilian butt lift?', a: 'In Nederland rond de EUR 6.000 volgens de NOS (2022). In de VS is het gemiddelde honorarium van de chirurg $7.264 (ASPS, 2023), zonder narcose en operatiekamer.' },
      { q: 'Hoe gevaarlijk is een Brazilian butt lift?', a: 'Een werkgroep van chirurgenverenigingen noemde in 2018 ongeveer 1 sterfgeval op 3.000 ingrepen. Een vervolgenquête uit 2019 kwam uit op 1 op 14.952, nadat chirurgen stopten met injecteren in de spier.' },
      { q: 'Wordt een Brazilian butt lift vergoed?', a: 'Nee. Een cosmetische ingreep die medisch niet nodig is, vergoedt de verzekering niet.' },
      { q: 'Hoe lang mag je niet zitten na een BBL?', a: 'Ongeveer twee weken niet lang zitten, volgens de Amerikaanse vereniging ASPS; sommige chirurgen vragen langer.' }
    ],
    verwant: ['nl/liposuctie-kosten', 'nl/borstvergroting-kosten', 'brazilian-butt-lift-cost-risks'], updated: '2026-11-17'
  },
  'de/brazilian-butt-lift-kosten-risiken': {
    taal: 'de', ingreep: 'bbl', naar: 'home', alt: 'bbl',
    title: 'Brazilian Butt Lift: Kosten, Risiko und Sicherheitsregeln',
    h1: 'Brazilian Butt Lift: was er kostet, wie riskant er ist und was Sie prüfen',
    desc: 'Was ein Brazilian Butt Lift kostet, wie hoch das Sterberisiko laut Studien ist, warum Fett nur unter die Haut darf und wie Sie den Arzt prüfen. Mit Quellen.',
    kort: 'Die gesetzliche Krankenkasse zahlt einen Brazilian Butt Lift nicht und kann Sie an den Kosten von Komplikationen beteiligen. [bblVz] In den USA lag das durchschnittliche Arzthonorar 2023 bei 7.264 US-Dollar, ohne Narkose und OP-Saal. [bblAsps23] [bblAspsCost] Fachgesellschaften sagen: Fett nur unter die Haut, nie in den Muskel. [bblAdvies2]',
    secties: [
      { h: 'Was es kostet', p: [
        'Für Deutschland haben wir keine Preisangabe einer unabhängigen Stelle gefunden. Holen Sie einen Gesamtpreis schriftlich ein: Arzt, Narkose, OP-Saal, Kompressionswäsche, Kontrollen und was eine Korrektur kostet.',
        'USA: Die Fachgesellschaft ASPS nennt für 2023 ein durchschnittliches Arzthonorar von 7.264 US-Dollar. [bblAsps23] Narkose, OP-Saal und weitere Kosten kommen hinzu. [bblAspsCost]',
        'Großbritannien: Der NHS nennt 3.000 bis 8.000 Pfund für eine chirurgische Eigenfettübertragung allgemein. [bblNhsFat] Im Ausland kann es laut NHS England bis zu 70 % billiger sein; die Zahl stammt aus einer Warnung. [bblNhsEng]'
      ] },
      { h: 'Krankenkasse', p: [
        'Für medizinisch nicht notwendige ästhetische Eingriffe zahlt die gesetzliche Krankenkasse nichts. Nach § 52 Abs. 2 SGB V kann sie Versicherte an den Kosten einer Komplikation beteiligen und Krankengeld versagen oder zurückfordern. [bblVz]'
      ] },
      { h: 'Wie riskant es ist', p: [
        'In einer Umfrage von 2017 meldeten 692 Chirurgen 198.857 Eingriffe mit 32 Todesfällen durch Fettembolie in der Lunge. Die Autoren schätzen die Sterblichkeit auf 1 zu 6.214 bis 1 zu 2.351. [bblMofid]',
        'Eine Arbeitsgruppe aus fünf Fachgesellschaften nannte im Januar 2018 etwa 1 zu 3.000, den höchsten Wert aller ästhetischen Eingriffe. [bblAdvies]',
        'Die britische Gesellschaft BAAPS zitiert 2022 eine Folgeumfrage von 2019 mit 1 zu 14.952, nachdem Chirurgen nicht mehr in den Muskel spritzten. Sie schätzt das tatsächliche Risiko auf etwa 1 zu 15.000. [bblBaapsReview]'
      ] },
      { h: 'Die entscheidende Regel: Fett nur unter die Haut', p: [
        'Die Arbeitsgruppe kam zu dem Schluss, dass Fett nur in das Gewebe unter der Haut und nie in den Muskel gehört. Bei jedem untersuchten Todesfall fand sich Fett im Gesäßmuskel. [bblAdvies2]',
        'BAAPS riet ihren Mitgliedern im Oktober 2018 von dem Eingriff ab. [bblBaaps18] Seit Oktober 2022 gilt dort: kein BBL, aber oberflächliche Eigenfettübertragung am Gesäß, mit Ultraschall während des Eingriffs. [bblBaaps22] Empfohlen werden höchstens drei solcher Eingriffe pro Chirurg und Tag. [bblBaapsReview]',
        'In Florida steht das im Gesetz: Fett nur unter die Haut, Ultraschall ist Pflicht, eine persönliche Untersuchung spätestens am Vortag und ein Arzt für jeweils einen Patienten. [bblFlorida]'
      ] },
      { h: 'Eingriff im Ausland', p: [
        'Das Auswärtige Amt warnt für die Türkei vor geplanten Eingriffen vor allem in der ästhetischen Chirurgie: Ansprüche lassen sich im Ausland schwer durchsetzen, und Krankenkassen zahlen Korrekturen in der Regel nicht. [bblAA]',
        'Die US-Behörde CDC zählte 93 US-Bürger, die zwischen 2009 und 2022 nach einer Schönheitsoperation in der Dominikanischen Republik starben. Von 24 genauer untersuchten Todesfällen folgten 22 auf eine Fettübertragung ins Gesäß. Alle 24 Patienten hatten mindestens zwei Eingriffe in einer Operation. [bblCdc]',
        'Das britische Außenministerium weiß von 7 Briten, die 2025 in der Türkei nach medizinischen Eingriffen starben. [bblFcdo]'
      ] },
      { h: 'Erholung', p: [
        'ASPS: etwa zwei Wochen nicht länger sitzen (manche Chirurgen verlangen mehr), Kompressionswäsche rund um die Uhr, Sport nach sechs bis acht Wochen. [bblHerstel]',
        'Laut NHS überleben etwa 50 % des übertragenen Fetts nicht; das Ergebnis zeigt sich nach bis zu 6 Monaten. [bblNhsFat]'
      ] },
      { h: 'So prüfen Sie den Arzt', p: [
        'Achten Sie auf den Titel Facharzt für Plastische und Ästhetische Chirurgie: mindestens sechs Jahre Weiterbildung und eine Prüfung vor der Ärztekammer. [bblDgpraec] Schönheitschirurg ist kein geschützter Titel. [bblVz]',
        'Fragen Sie schriftlich: wohin genau das Fett kommt (nur unter die Haut), ob beim Einspritzen Ultraschall verwendet wird, wie viele dieser Eingriffe der Arzt an einem Tag macht und wer eine Komplikation behandelt, wenn Sie wieder zu Hause sind.'
      ] }
    ],
    faq: [
      { q: 'Was kostet ein Brazilian Butt Lift?', a: 'Eine unabhängige Preisangabe für Deutschland haben wir nicht gefunden. In den USA lag das durchschnittliche Arzthonorar 2023 bei 7.264 US-Dollar (ASPS), ohne Narkose und OP-Saal.' },
      { q: 'Wie gefährlich ist ein Brazilian Butt Lift?', a: 'Eine Arbeitsgruppe von Fachgesellschaften nannte 2018 etwa 1 Todesfall auf 3.000 Eingriffe. Eine Folgeumfrage von 2019 ergab 1 zu 14.952, nachdem nicht mehr in den Muskel gespritzt wurde.' },
      { q: 'Zahlt die Krankenkasse einen Brazilian Butt Lift?', a: 'Nein. Bei Komplikationen kann die Kasse Sie nach § 52 Abs. 2 SGB V an den Kosten beteiligen.' },
      { q: 'Wie lange darf man nach einem BBL nicht sitzen?', a: 'Etwa zwei Wochen nicht länger sitzen, laut der US-Fachgesellschaft ASPS; manche Chirurgen verlangen mehr.' }
    ],
    verwant: ['de/fettabsaugung-kosten', 'de/brustvergroesserung-kosten', 'brazilian-butt-lift-cost-risks'], updated: '2026-11-17'
  },
  'cataract-surgery-cost': {
    taal: 'en', ingreep: 'cataract', naar: 'home', alt: 'cataract',
    title: 'Cataract surgery cost, premium lenses and recovery',
    h1: 'Cataract surgery: what it costs, what you pay for a premium lens and how recovery goes',
    desc: 'What cataract surgery costs privately in the UK, what Medicare pays in the US, what a premium lens adds, how long recovery takes and the complication figures.',
    kort: 'On the NHS cataract surgery is free, usually with a standard monofocal lens. Privately in the UK it typically costs £2,000 to £4,000 per eye with that lens. [staarWhich] In the US Medicare Part B covers surgery with a conventional lens and you pay 20% after the deductible. [staarMedicare] The operation usually takes 20 to 45 minutes. [staarNhs]',
    secties: [
      { h: 'What it costs', p: [
        'United Kingdom: Which? collected provider prices in July 2026. Private surgery typically costs £2,000 to £4,000 per eye with a standard monofocal lens, £3,200 to £4,900 with a multifocal or trifocal lens and £3,000 to £3,800 with an extended depth of focus lens. NHS surgery is free and the lens is usually a standard monofocal. The NHS wait is typically 8 to 26 weeks. [staarWhich]',
        'United States: Medicare Part B may cover cataract surgery that implants a conventional lens. After the Part B deductible you pay 20% of the approved amount. It also covers one pair of standard glasses or one set of contact lenses after each operation. [staarMedicare] The Part B deductible for 2026 is $283. [staarFr]'
      ] },
      { h: 'Premium lenses', p: [
        'Medicare and most insurers cover the monofocal lens. Premium lenses are usually paid out of pocket, and some cost more than a thousand dollars. [staarAao]',
        'A monofocal lens is sharp at one distance, so most people still need glasses for reading or for distance. Ask what the extra price per eye covers: the lens only, or also extra measurements and checks.'
      ] },
      { h: 'The operation and recovery', p: [
        'The operation usually takes 20 to 45 minutes. You use eye drops for about 4 weeks, and it may take several days for your sight to improve. The NHS treats two eyes on separate days. [staarNhs]',
        'The NHS says not to drive until your vision is back to normal, and not to swim, rub the eye, lift heavy things or wear eye make-up while you recover. [staarNhs]',
        'The American Academy of Ophthalmology says light exercise such as walking is fine the day after surgery, to wait one week for running, cycling, tennis and golf, and two weeks before swimming. [staarAaoHerstel]',
        'None of the NHS and AAO pages we read gives a rule about alcohol after cataract surgery. Ask your own surgeon, especially if you were sedated or take medication.'
      ] },
      { h: 'Complications in figures', p: [
        'In the UK national audit of operations between April 2023 and March 2024, the lens capsule tore during 0.69% of operations. [staarRco]',
        'The German institute IQWiG gives these estimates: clouding of the capsule behind the new lens in 25 to 40 of 100 people within 5 years, an infection inside the eye in fewer than 1 of 100, and a detached retina in about 1 of 100. [staarIqwig]'
      ] },
      { h: 'How to check the doctor and the clinic', p: [
        'In the UK, look the surgeon up on the GMC register and check the specialist register for ophthalmology. [bblGmc]',
        'Ask the clinic for its own capsule tear rate and how many cataract operations the surgeon does in a year, and compare that with the national audit figure. [staarRco]'
      ] }
    ],
    faq: [
      { q: 'How much does cataract surgery cost?', a: 'Privately in the UK typically £2,000 to £4,000 per eye with a standard lens (Which?, 2026). On the NHS it is free. In the US Medicare Part B pays for surgery with a conventional lens and you pay 20% after the deductible.' },
      { q: 'How long does cataract surgery take?', a: 'Usually 20 to 45 minutes, according to the NHS.' },
      { q: 'How long is recovery after cataract surgery?', a: 'Sight may take several days to improve and you use eye drops for about 4 weeks. The AAO says to wait one week for sports such as running and two weeks before swimming.' },
      { q: 'Does Medicare pay for premium lenses?', a: 'No. Medicare covers the conventional monofocal lens; the extra for a premium lens is usually paid out of pocket.' }
    ],
    verwant: ['eyelid-surgery-cost', 'nl/staaroperatie-kosten', 'de/grauer-star-op-kosten'], updated: '2026-11-17'
  },
  'nl/staaroperatie-kosten': {
    taal: 'nl', ingreep: 'cataract', naar: 'home', alt: 'cataract',
    title: 'Staaroperatie: kosten, vergoeding, lenskeuze en herstel',
    h1: 'Staaroperatie: wat je zelf betaalt, welke lens je kiest en hoe het herstel gaat',
    desc: 'Wat de basisverzekering betaalt bij een staaroperatie, wat je bijbetaalt voor een torische of multifocale lens, hoe het herstel gaat en hoe vaak het misgaat.',
    kort: 'Een staaroperatie met een standaardlens valt onder de basisverzekering; de meerprijs van een multifocale lens betaal je zelf. [staarZK] Het eigen risico is in 2026 en 2027 EUR 385. [staarER] Twee ziekenhuizen die hun prijzen publiceren vragen EUR 600 tot 1.850 per oog bij voor een andere lens. [staarAsz] [staarJbz] In 2025 zag 94,1% van de geopereerden daarna beter. [staarNog]',
    secties: [
      { h: 'Wat de verzekering betaalt', p: [
        'Een staaroperatie met een standaardlens is medisch-specialistische zorg uit de basisverzekering. De meerprijs van een multifocale lens wordt niet vergoed. Een torische of multifocale lens wordt alleen vergoed bij bepaalde medische indicaties. [staarZK]',
        'Volgens het standpunt van het Zorginstituut uit 2011 is een patiënt alleen in zeer uitzonderlijke gevallen medisch aangewezen op multifocale lenzen. Wie er zelf voor kiest, krijgt de standaardbehandeling vergoed en betaalt de rest bij. [staarZin]',
        'Het verplichte eigen risico is EUR 385 in 2026 en in 2027. [staarER] Ook bij de operatie met een standaardlens betaal je het eigen risico. [staarAsz]'
      ] },
      { h: 'Wat je bijbetaalt voor een andere lens', p: [
        'Een prijsoverzicht van een onafhankelijke instantie hebben we niet gevonden. Twee ziekenhuizen publiceren hun eigen bijbetaling per oog.',
        'Jeroen Bosch Ziekenhuis (september 2026): torische lens EUR 800, EDOF-lens EUR 1.500, trifocale lens EUR 1.850. [staarJbz]',
        'Albert Schweitzer ziekenhuis (augustus 2026): torische lens EUR 600, EDOF-lens EUR 1.050, torische EDOF-lens EUR 1.200. Multifocale lenzen plaatst dit ziekenhuis niet meer. [staarAsz]',
        'Vraag bij je eigen kliniek wat de bijbetaling per oog is en of extra metingen en controles erin zitten.'
      ] },
      { h: 'Hoe vaak het goed gaat', p: [
        'In de landelijke registratie van oogartsen staan 141.134 patiënten die in 2025 een staaroperatie kregen. 94,1% zag daarna beter. Bij 1,64% was er een complicatie tijdens de operatie, bij 1,74% erna, en 0,38% werd opnieuw geopereerd. [staarNog]',
        'Een infectie in het oog kwam in 2019 voor bij ongeveer 0,01% van de staaroperaties in Nederland, tegen ongeveer 0,05% in 2010. [staarEndo]',
        'Nastaar, een vertroebeling achter de nieuwe lens, krijgen naar schatting 25 tot 40 van de 100 mensen binnen 5 jaar, volgens het Duitse instituut IQWiG. [staarIqwig] Het wordt met een laser behandeld.'
      ] },
      { h: 'Twee ogen op één dag', p: [
        'Volgens het Zorginstituut kan een tweezijdige staaroperatie op één dag zonder verhoogd risico op complicaties. 58% van de patiënten laat beide ogen binnen 12 maanden opereren. [staarTwee]',
        'De richtlijn voor oogartsen zegt dat bij elke patiënt wordt overwogen of beide ogen op één dag kunnen. In het Nederlandse BICAT-onderzoek had 1,31% een ernstige complicatie bij opereren op één dag, tegen 2,46% bij opereren op twee dagen. [staarBicat]'
      ] },
      { h: 'Herstel', p: [
        'Je gaat dezelfde dag naar huis en mag niet zelf rijden. Vaak zie je binnen enkele dagen beter. Een nieuwe bril volgt ongeveer 6 weken na de operatie. [staarKeuze]',
        'De eerste twee weken: niet zwemmen of naar de sauna, niet in het oog wrijven en geen zware inspanning; wandelen en fietsen mag. Autorijden kan weer als je scherp genoeg ziet. [staarAntonius]',
        'Over alcohol na een staaroperatie staat niets in de patiënteninformatie die we lazen (St. Antonius, NHS, de Amerikaanse oogartsenvereniging, IQWiG). Vraag het je eigen oogarts, zeker als je een roesje kreeg of medicijnen gebruikt.'
      ] },
      { h: 'Wachttijd en kliniek kiezen', p: [
        'De norm is hoogstens 4 weken wachten op een eerste afspraak en hoogstens 7 weken op de behandeling. [staarTreek] De actuele wachttijd per ziekenhuis en kliniek staat op ZorgkaartNederland, met cijfers van de NZa. [staarWacht]',
        'Zoek de oogarts op in het BIG-register: daar staat het specialisme en of er een maatregel is opgelegd. [bblBig]'
      ] }
    ],
    faq: [
      { q: 'Wordt een staaroperatie vergoed?', a: 'Ja, met een standaardlens uit de basisverzekering. Je betaalt wel je eigen risico (EUR 385 in 2026 en 2027). De meerprijs van een multifocale lens betaal je zelf.' },
      { q: 'Wat kost een multifocale of torische lens bij een staaroperatie?', a: 'Twee ziekenhuizen die hun prijzen publiceren vragen per oog EUR 600 tot 800 bij voor een torische lens en EUR 1.050 tot 1.850 voor een EDOF- of trifocale lens.' },
      { q: 'Hoe lang duurt het herstel na een staaroperatie?', a: 'Vaak zie je binnen enkele dagen beter. De eerste twee weken niet zwemmen, niet wrijven en geen zware inspanning. Een nieuwe bril volgt na ongeveer 6 weken.' },
      { q: 'Mag je alcohol drinken na een staaroperatie?', a: 'In de patiënteninformatie die we lazen staat er geen regel over. Vraag het je oogarts, zeker als je een roesje kreeg of medicijnen gebruikt.' },
      { q: 'Kunnen beide ogen op één dag?', a: 'Ja. Volgens het Zorginstituut kan dat zonder verhoogd risico op complicaties, en de richtlijn vraagt oogartsen dit bij elke patiënt te overwegen.' }
    ],
    verwant: ['nl/ooglidcorrectie-kosten', 'nl/liposuctie-kosten', 'cataract-surgery-cost'], updated: '2026-11-17'
  },
  'de/grauer-star-op-kosten': {
    taal: 'de', ingreep: 'cataract', naar: 'home', alt: 'cataract',
    title: 'Grauer Star OP: Kosten, Sonderlinsen und Erholung',
    h1: 'Grauer-Star-Operation: was die Kasse zahlt, was Sonderlinsen kosten und wie die Erholung läuft',
    desc: 'Was die Krankenkasse bei der Grauer-Star-OP zahlt, was Sonderlinsen und Laser zusätzlich kosten, wie lange die Erholung dauert und wie häufig Komplikationen sind.',
    kort: 'Die gesetzliche Krankenkasse zahlt die Operation mit einer Standardlinse; bei einer Sonderlinse tragen Sie die Mehrkosten. [staarVz] Ein Eingriff mit Laser kostet etwa 700 bis 2.100 Euro, die Sie ganz oder teilweise selbst zahlen. [staarIqwig] Die Operation dauert etwa 20 bis 30 Minuten. [staarIqwig]',
    secties: [
      { h: 'Was die Kasse zahlt', p: [
        'Die gesetzliche Krankenkasse zahlt das Einsetzen einer Standardlinse (Monofokallinse). Wählen Sie eine Sonderlinse, zahlen Sie nur die Mehrkosten. Ein Beschluss vom 9. Juni 2026, in Kraft seit 1. Juli 2026, bestätigt, dass Operation und Nachsorge Kassenleistung bleiben. [staarVz]',
        'Die Kasse übernimmt die vollen Kosten nur bei einer Monofokallinse ohne Laser. Multifokale, torische, Blaufilter- und EDoF-Linsen bedeuten Mehrkosten. [staarIqwig]'
      ] },
      { h: 'Was Sonderlinsen und Laser kosten', p: [
        'Ein Eingriff mit Laser kostet etwa 700 bis 2.100 Euro, die Sie ganz oder teilweise selbst zahlen. [staarIqwig]',
        'Die Zuzahlung liegt nach Experten zwischen 200 und 1.500 Euro pro Linse und Auge. Die Angabe stammt aus einem Bericht von 2021; eine neuere unabhängige Preisspanne haben wir nicht gefunden. [staarAu]',
        'Lassen Sie sich die Mehrkosten pro Auge schriftlich geben und fragen Sie, ob zusätzliche Messungen und Kontrollen enthalten sind.'
      ] },
      { h: 'Wie häufig Komplikationen sind', p: [
        'Das IQWiG nennt diese Schätzungen: Nachstar bei 25 bis 40 von 100 Menschen innerhalb von 5 Jahren, eine Entzündung im Auge bei weniger als 1 von 100, eine Netzhautablösung bei etwa 1 von 100 und eine Verletzung der Linsenkapsel bei etwa 2 von 100 Operationen. [staarIqwig]',
        'In Deutschland werden jährlich etwa 800.000 Operationen gezählt (Verbraucherzentrale) [staarVz], die Fachgesellschaft DOG spricht von etwa einer Million Eingriffen. [staarDog]'
      ] },
      { h: 'Erholung', p: [
        'Die Operation dauert etwa 20 bis 30 Minuten. Danach tragen Sie 24 Stunden einen Augenverband. Etwa eine Woche nicht lesen, bis zu zwei Wochen kein Sport mit Erschütterungen. Arbeitsfähig sind die meisten nach etwa 1 bis 2 Wochen. [staarIqwig]',
        'Autofahren ist meist nach einigen Wochen wieder möglich. Bis das Sehen optimal ist, vergehen Wochen bis Monate; eine Brille wird deshalb erst nach einigen Wochen angepasst. [staarIqwig]',
        'Zu Alkohol nach der Operation steht in den Patienteninformationen, die wir gelesen haben (IQWiG, NHS, die US-Fachgesellschaft AAO), keine Regel. Fragen Sie Ihren Augenarzt, vor allem nach einer Beruhigungsspritze oder bei Medikamenten.'
      ] },
      { h: 'Arzt und Klinik prüfen', p: [
        'Fragen Sie nach der Zahl der Grauer-Star-Operationen des Operateurs pro Jahr und nach der eigenen Rate an Kapselverletzungen, und vergleichen Sie mit den Schätzungen des IQWiG. [staarIqwig]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Grauer-Star-OP?', a: 'Mit Standardlinse zahlt die gesetzliche Krankenkasse. Für eine Sonderlinse zahlen Sie die Mehrkosten, für einen Eingriff mit Laser etwa 700 bis 2.100 Euro ganz oder teilweise selbst (IQWiG).' },
      { q: 'Wie lange dauert die Grauer-Star-OP?', a: 'Etwa 20 bis 30 Minuten, laut IQWiG.' },
      { q: 'Wie lange dauert die Erholung nach der Grauer-Star-OP?', a: 'Arbeitsfähig sind die meisten nach 1 bis 2 Wochen. Bis das Sehen optimal ist, vergehen Wochen bis Monate.' },
      { q: 'Wie häufig ist Nachstar?', a: 'Bei geschätzt 25 bis 40 von 100 Menschen innerhalb von 5 Jahren, laut IQWiG.' }
    ],
    verwant: ['de/fettabsaugung-kosten', 'cataract-surgery-cost', 'nl/staaroperatie-kosten'], updated: '2026-11-17'
  }
});

// 18 nov 2026 (dagronde): gids borstlift, de grootste kostenvraag zonder pagina (Demand Radar 16 nov: DE Bruststraffung
// Kosten 6.600 plus 'kosten einer/für bruststraffung' 6.600 elk; NL 'wat kost een borstlifting' 320). Elk feit is op
// 18 november 2026 op de bronpagina zelf gelezen. Geen onafhankelijke Nederlandse of Britse prijsrange gevonden: in NL staat
// de prijslijst van een ziekenhuis, zo benoemd; een Britse prijs staat er niet.
Object.assign(SRC, {
  aspsLift: { t: 'ASPS: breast lift cost (average surgeon fee)', u: 'https://www.plasticsurgery.org/cosmetic-procedures/breast-lift/cost' },
  aspsLiftSafety: { t: 'ASPS: breast lift safety and risks', u: 'https://www.plasticsurgery.org/cosmetic-procedures/breast-lift/safety' },
  aspsLiftResults: { t: 'ASPS: breast lift results', u: 'https://www.plasticsurgery.org/cosmetic-procedures/breast-lift/results' },
  mayoLift: { t: 'Mayo Clinic: breast lift (22 November 2025)', u: 'https://www.mayoclinic.org/tests-procedures/breast-lift/about/pac-20393218' },
  phinLift: { t: 'PHIN (Private Healthcare Information Network): breast lift (1 July 2025)', u: 'https://www.phin.org.uk/help/breast-lift' },
  nhsCosmNhs: { t: 'NHS: cosmetic procedures on the NHS', u: 'https://www.nhs.uk/tests-and-treatments/cosmetic-procedures/advice/cosmetic-procedures-on-the-nhs/' },
  skgzLift: { t: 'SKGZ: uitspraak 201902070 over een borstlift (1 juli 2020)', u: 'https://uitspraken.skgz.nl/pdf-embed/5bc7dd0c-4acc-4679-8974-9a2f91702fbf' },
  zkWerkwijzer: { t: 'Zilveren Kruis: werkwijzer plastische chirurgie', u: 'https://www.zilverenkruis.nl/-/media/zilverenkruis/files/consumenten/vergoedingen/simpele-vav-werkwijzer.pdf' },
  apoLift: { t: 'apotheken.de: Bruststraffung (27. April 2026)', u: 'https://www.apotheken.de/sondertext/24h04-bruststraffung' },
  fitbookLift: { t: 'Fitbook: Krankenkasse muss Bruststraffung zahlen, SG Speyer S 19 KR 450/22 (14. Juli 2025)', u: 'https://www.fitbook.de/mind-body/krankenkasse-bruststraffung' },
  aspsTrends27: { t: 'ASPS: 2027 plastic surgery trend predictions (17 November 2026)', u: 'https://www.plasticsurgery.org/news/articles/2027-plastic-surgery-trend-predictions-what-surgeons-see-coming-next' },
  nationRaid: { t: 'The Nation Thailand: raid on Bangkok clinic making unregistered injectables (17 November 2026)', u: 'https://www.nationthailand.com/news/general/40073599' },
  bzKasse27: { t: 'Berliner Zeitung: Krankenkasse 2027, im Dezember wird es ernst (18. November 2026)', u: 'https://www.berliner-zeitung.de/article/krankenkasse-2027-fuer-viele-gesetzlich-versicherte-wird-es-im-dezember-ernst-10607550' }
});

Object.assign(PAGES, {
  'breast-lift-cost': {
    taal: 'en', ingreep: 'breast-lift', naar: 'home', alt: 'breast-lift', published: '2026-11-18', updated: '2026-11-18',
    title: 'Breast lift cost in 2026: surgeon fee and insurance',
    h1: 'Breast lift cost: the surgeon fee, the full bill and who pays',
    desc: 'ASPS surgeon fees for a breast lift, prices in the Netherlands and Germany, when insurance pays, recovery and the risks. Independent, with sources.',
    kort: 'The American Society of Plastic Surgeons gives an average cost of $6,816 for a breast lift. That is the surgeon fee only: anesthesia, the operating room and other costs come on top. [aspsLift] Most health plans do not cover a breast lift, and the NHS does not provide it as a cosmetic operation. [aspsLift] [phinLift]',
    secties: [
      { h: 'What it costs', p: [
        'United States: average surgeon fee $6,816, without anesthesia, operating room facilities or other related expenses. [aspsLift] The ASPS cost table for 2024 gives a range of $6,500 to $11,000 for the surgeon fee. [aspsCost]',
        'United Kingdom: the independent PHIN says costs vary by hospital and surgeon, and a first consultation costs about £100 to £200. [phinLift]',
        'Netherlands: the Reinier de Graaf hospital charges EUR 5,500 for a breast lift and EUR 6,200 for an extended breast lift in its 2026 price list for uninsured care. That is one hospital, not a national average. [rdgf2026]',
        'Germany: between EUR 3,000 and 10,000 for a breast lift or reduction, according to apotheken.de. [apoLift]',
        'Ask every clinic for one total price in writing: surgeon, anesthesia, operating room, garments, check-ups and the cost of a correction.'
      ] },
      { h: 'When insurance pays', p: [
        'US: most health plans do not cover a breast lift or its complications. [aspsLift]',
        'UK: cosmetic surgery is not routinely available on the NHS, and private medical insurance does not cover a cosmetic breast lift. [nhsCosmNhs] [phinLift]',
        'Netherlands: basic insurance pays for plastic surgery only with a proven physical function problem or a disfigurement after disease, an accident or treatment. Lifting sagging breasts is not covered. [skgzLift] [uniVerklein]',
        'Germany: the statutory insurer pays only when it is medically necessary, after an application that the Medical Service usually checks. [bblVz] In one case a court in Speyer made an insurer pay for a breast lift after a woman lost about 60 kg; the insurer had also missed its deadline. That was one ruling, not a general rule. [fitbookLift]'
      ] },
      { h: 'Recovery', p: [
        'PHIN: you can usually drive again in week 1, go back to work in week 2 and return to most normal activities by week 6. [phinLift]',
        'Scars do not go away, but they tend to soften and fade within 1 to 2 years. [mayoLift]'
      ] },
      { h: 'Risks and timing', p: [
        'ASPS lists changes in nipple or breast sensation, which may be temporary or permanent, and possible partial or total loss of the nipple and areola among the risks. [aspsLiftSafety]',
        'Breastfeeding is usually possible after a breast lift, but some people may have trouble making enough milk. [mayoLift]',
        'Pregnancy can reduce or reverse the result, and so can a large weight loss after surgery. [aspsLiftResults] Surgeons suggest waiting about six months to a year after you stop breastfeeding. [mayoLift]'
      ] }
    ],
    faq: [
      { q: 'How much does a breast lift cost?', a: 'ASPS gives an average surgeon fee of $6,816, without anesthesia and operating room. A Dutch hospital charges EUR 5,500 in 2026; in Germany apotheken.de names EUR 3,000 to 10,000.' },
      { q: 'Does insurance pay for a breast lift?', a: 'Usually not. Most US health plans do not cover it, the NHS does not provide it as a cosmetic operation, and Dutch basic insurance does not pay for lifting sagging breasts.' },
      { q: 'How long is the recovery after a breast lift?', a: 'According to PHIN you can usually go back to work in week 2 and return to most normal activities by week 6.' },
      { q: 'Can I breastfeed after a breast lift?', a: 'Usually yes, according to Mayo Clinic, but some people may have trouble making enough milk.' }
    ],
    verwant: ['nl/borstlift-kosten', 'de/bruststraffung-kosten', 'breast-reduction-cost']
  },
  'nl/borstlift-kosten': {
    taal: 'nl', ingreep: 'breast-lift', naar: 'home', alt: 'breast-lift', published: '2026-11-18', updated: '2026-11-18',
    title: 'Borstlift kosten 2026: prijs en vergoeding',
    h1: 'Borstlift: wat het kost en waarom de verzekering meestal niet betaalt',
    desc: 'Wat een borstlift kost in Nederland, Duitsland en de VS, waarom de zorgverzekering hangende borsten niet vergoedt, het herstel en de risico\'s. Met bronnen.',
    kort: 'Het Reinier de Graaf ziekenhuis rekent in 2026 EUR 5.500 voor een borstlift en EUR 6.200 voor een uitgebreide borstlift, als je zelf betaalt. [rdgf2026] De zorgverzekering vergoedt het liften van hangende borsten niet. [uniVerklein]',
    secties: [
      { h: 'Wat het kost', p: [
        'Nederland: EUR 5.500 voor een borstlift en EUR 6.200 voor een uitgebreide borstlift in de prijslijst onverzekerde zorg 2026 van het Reinier de Graaf ziekenhuis. Dat is één ziekenhuis, geen landelijk gemiddelde. [rdgf2026]',
        'Duitsland: tussen EUR 3.000 en 10.000 voor een borstlift of borstverkleining, volgens apotheken.de. [apoLift]',
        'Verenigde Staten: de vereniging van plastisch chirurgen ASPS noemt gemiddeld $6.816, alleen voor de chirurg. Narcose, operatiekamer en andere kosten komen daar nog bij. [aspsLift]',
        'Vraag bij elke kliniek één totaalprijs op papier: chirurg, narcose, operatiekamer, controles en wat een correctie kost.'
      ] },
      { h: 'Vergoeding', p: [
        'De basisverzekering betaalt plastische chirurgie alleen bij een afwijking in het uiterlijk met aantoonbare lichamelijke functiestoornissen, of bij een verminking door ziekte, een ongeval of een medische behandeling. [skgzLift]',
        'Het liften van hangende borsten wordt niet vergoed, schrijft Univé. [uniVerklein] Zilveren Kruis noemt het liften van de borsten een cosmetische ingreep. [zkWerkwijzer]',
        'In een zaak bij de Geschillencommissie Zorgverzekeringen (SKGZ) werd een borstlift na het verwijderen van prothesen niet vergoed, ook niet uit de aanvullende verzekering. [skgzLift]',
        'In 2027 heeft alleen ONVZ met Topfit een aanvullende verzekering die plastische chirurgie vergoedt, en dan alleen als het medisch noodzakelijk is. [geldPlast]'
      ] },
      { h: 'Herstel', p: [
        'Volgens het Britse PHIN kun je meestal in week 1 weer autorijden, in week 2 weer werken en in week 6 de meeste gewone dingen weer doen. [phinLift]',
        'Littekens gaan niet weg, maar worden binnen 1 tot 2 jaar zachter en lichter. [mayoLift]'
      ] },
      { h: 'Risico\'s en het goede moment', p: [
        'ASPS noemt onder meer een ander gevoel in tepel of borst, tijdelijk of blijvend, en mogelijk gedeeltelijk of helemaal verlies van tepel en tepelhof. [aspsLiftSafety]',
        'Borstvoeding geven kan meestal nog, maar sommige vrouwen maken dan te weinig melk. [mayoLift]',
        'Een zwangerschap of veel afvallen na de operatie kan het resultaat kleiner maken of tenietdoen. [aspsLiftResults] Chirurgen raden aan zes maanden tot een jaar te wachten nadat je bent gestopt met borstvoeding. [mayoLift]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een borstlift?', a: 'Het Reinier de Graaf ziekenhuis rekent in 2026 EUR 5.500, of EUR 6.200 voor een uitgebreide borstlift. In Duitsland noemt apotheken.de EUR 3.000 tot 10.000.' },
      { q: 'Wordt een borstlift vergoed?', a: 'Meestal niet. De basisverzekering vergoedt het liften van hangende borsten niet. In 2027 vergoedt alleen ONVZ Topfit plastische chirurgie, en alleen bij medische noodzaak.' },
      { q: 'Hoe lang duurt het herstel na een borstlift?', a: 'Volgens PHIN werk je meestal in week 2 weer en doe je in week 6 de meeste gewone dingen weer.' },
      { q: 'Kan ik na een borstlift nog borstvoeding geven?', a: 'Meestal wel, volgens Mayo Clinic, maar sommige vrouwen maken dan te weinig melk.' }
    ],
    verwant: ['nl/borstverkleining-kosten', 'nl/borstvergroting-kosten', 'breast-lift-cost']
  },
  'de/bruststraffung-kosten': {
    taal: 'de', ingreep: 'breast-lift', naar: 'home', alt: 'breast-lift', published: '2026-11-18', updated: '2026-11-18',
    title: 'Bruststraffung Kosten 2026: Preis und Krankenkasse',
    h1: 'Bruststraffung: was sie kostet und wann die Krankenkasse zahlt',
    desc: 'Was eine Bruststraffung kostet, wann die Krankenkasse zahlt, ein Urteil nach starker Gewichtsabnahme, Heilung und Risiken. Unabhängig, mit Quellen.',
    kort: 'Eine Bruststraffung oder Brustverkleinerung kostet laut apotheken.de zwischen 3.000 und 10.000 Euro. Weil die Straffung ästhetisch ist, zahlen Patientinnen sie in der Regel selbst. [apoLift] Die Krankenkasse zahlt nur bei medizinischer Notwendigkeit und nach einem Antrag. [bblVz]',
    secties: [
      { h: 'Was es kostet', p: [
        'Deutschland: zwischen 3.000 und 10.000 Euro für eine Bruststraffung oder Brustverkleinerung, laut apotheken.de. [apoLift]',
        'Zum Vergleich Niederlande: Das Krankenhaus Reinier de Graaf berechnet 2026 für Selbstzahler 5.500 Euro für eine Bruststraffung und 6.200 Euro für eine erweiterte Bruststraffung. Das ist ein Krankenhaus, kein Durchschnitt. [rdgf2026]',
        'USA: Die amerikanische Gesellschaft der plastischen Chirurgen ASPS nennt durchschnittlich 6.816 Dollar, nur für den Chirurgen, ohne Narkose und OP-Saal. [aspsLift]',
        'Lassen Sie sich einen Gesamtpreis schriftlich geben: Chirurg, Narkose, OP-Saal, Nachkontrollen und was eine Korrektur kostet.'
      ] },
      { h: 'Wann die Krankenkasse zahlt', p: [
        'Die gesetzliche Krankenkasse zahlt nur bei medizinischer Notwendigkeit, also bei einer Funktionseinschränkung oder einer Entstellung mit starker seelischer Belastung. Sie stellen vorher einen Antrag, den in der Regel der Medizinische Dienst prüft. [bblVz]',
        'Folgen Komplikationen nach einer medizinisch nicht nötigen Operation, kann die Kasse Sie an den Kosten beteiligen (§ 52 Abs. 2 SGB V). [bblVz]',
        'Ein Urteil: Das Sozialgericht Speyer (S 19 KR 450/22) verpflichtete eine Kasse, eine Bruststraffung zu zahlen, nachdem eine Frau nach einer Magenverkleinerung rund 60 Kilo abgenommen hatte. Den Ausschlag gaben die medizinische Notwendigkeit und eine verpasste Frist: Die Kasse hat 3 Wochen Zeit, mit Medizinischem Dienst 5 Wochen, sonst gilt die Leistung als genehmigt. Das ist ein Einzelfall. [fitbookLift]'
      ] },
      { h: 'Heilung', p: [
        'Laut apotheken.de sollten Sie Sport und körperliche Anstrengung drei Monate meiden. [apoLift]',
        'Narben verschwinden nicht, werden aber innerhalb von 1 bis 2 Jahren weicher und heller. [mayoLift]'
      ] },
      { h: 'Risiken und der richtige Zeitpunkt', p: [
        'ASPS nennt unter anderem ein verändertes Gefühl in Brustwarze oder Brust, vorübergehend oder dauerhaft, und den möglichen teilweisen oder vollständigen Verlust von Brustwarze und Warzenhof. [aspsLiftSafety]',
        'Stillen ist nach einer Straffung meist noch möglich, manche Frauen bilden aber zu wenig Milch. [mayoLift]',
        'Eine Schwangerschaft oder starke Gewichtsabnahme nach der Operation kann das Ergebnis verringern oder aufheben. [aspsLiftResults] apotheken.de rät zur Operation, wenn die Familienplanung abgeschlossen ist und Diäten vorher beendet sind. [apoLift]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Bruststraffung?', a: 'Laut apotheken.de zwischen 3.000 und 10.000 Euro für eine Bruststraffung oder Brustverkleinerung. In den Niederlanden berechnet ein Krankenhaus 2026 5.500 Euro.' },
      { q: 'Zahlt die Krankenkasse eine Bruststraffung?', a: 'Nur bei medizinischer Notwendigkeit und nach einem Antrag, den meist der Medizinische Dienst prüft. Aus ästhetischen Gründen zahlen Sie selbst.' },
      { q: 'Zahlt die Kasse nach starker Gewichtsabnahme?', a: 'Im Einzelfall: Das Sozialgericht Speyer verpflichtete eine Kasse nach rund 60 Kilo Gewichtsabnahme, auch weil sie die Frist verpasst hatte.' },
      { q: 'Wann darf ich nach einer Bruststraffung wieder Sport machen?', a: 'Laut apotheken.de sollten Sie Sport und körperliche Anstrengung drei Monate meiden.' }
    ],
    verwant: ['de/brustverkleinerung-kosten', 'de/brustvergroesserung-kosten', 'breast-lift-cost']
  }
});
for (const [s, v] of [['breast-reduction-cost', 'breast-lift-cost'], ['nl/borstverkleining-kosten', 'nl/borstlift-kosten'], ['de/brustverkleinerung-kosten', 'de/bruststraffung-kosten']]) PAGES[s].verwant.push(v);

// Gids buikwandcorrectie (19 nov 2026, dagronde): grootste kostenvraag zonder eigen gids (Demand Radar NL 16 nov:
// buikwandcorrectie 5.400 per maand, buikwandcorrectie kosten 1.600, wat kost een buikwandcorrectie 720). De Engelse
// pagina gaat over de prijs thuis en de verzekering; tummy-tuck-abroad-cost blijft de pagina over het buitenland.
// Elk feit is op 19 november 2026 op de bronpagina gelezen. Elkerliek is een prijslijst van 2025, zo benoemd.
Object.assign(SRC, {
  aspsTummy: { t: 'ASPS: tummy tuck cost (average surgeon fee)', u: 'https://www.plasticsurgery.org/cosmetic-procedures/tummy-tuck/cost' },
  nhsTummy: { t: 'NHS: tummy tuck (abdominoplasty), reviewed 29 September 2023', u: 'https://www.nhs.uk/conditions/cosmetic-procedures/cosmetic-surgery/tummy-tuck/' },
  phinTummy: { t: 'PHIN: tummy tuck recovery, what you need to know (1 April 2026)', u: 'https://www.phin.org.uk/help/tummy-tuck-recovery-what-you-need-to-know' },
  mayoTummy: { t: 'Mayo Clinic: tummy tuck (17 January 2025)', u: 'https://www.mayoclinic.org/tests-procedures/tummy-tuck/about/pac-20384892' },
  elkerliek2025: { t: 'Elkerliek Esthetiek: prijslijst (versie 2025-2)', u: 'https://www.elkerliek.nl/elkerliek.nl/specialismen/Elkerliek%20Esthetiek/Prijslijst-Elkerliek-Esthetiek.pdf' },
  cbBuikwand: { t: 'Consumentenbond: vergoeding buikwandcorrectie 2027', u: 'https://www.consumentenbond.nl/zorgverzekering/vergoedingen/buikwandcorrectie' },
  gumpertBauch: { t: 'Dr. Gumpert: Bauchdeckenstraffung (22.10.2021)', u: 'https://www.dr-gumpert.de/html/bauchdeckenstraffung.html' },
  tonlineSchuerze: { t: 't-online: Fettschürze, was ist das und wie wird man sie wieder los (aktualisiert 08.05.2025)', u: 'https://www.t-online.de/gesundheit/abnehmen/id_100224922/fettschuerze-was-ist-das-und-wie-wird-man-sie-wieder-los-.html' },
  aebBsg: { t: 'Ärzteblatt: Kasse muss nach Magenverkleinerung nicht automatisch für Hautstraffung zahlen, BSG B 1 KR 15/24 B (29.08.2025)', u: 'https://www.aerzteblatt.de/themen/kostenerstattung/kasse-muss-nach-magenverkleinerung-nicht-automatisch-fur-hautstraffung-zahlen-283dab79-c744-442c-b12f-0ff3c6c6cdaf' },
  drEscano: { t: 'Canal 6: Salud Pública clausura quirófanos de centro médico en Gazcue tras muerte de joven (18 November 2026)', u: 'https://elseis.do/noticias/salud-publica-clausura-quirofanos-de-centro-medico-en-gazcue-tras-muerte-de-joven' },
  drSiete: { t: 'N Digital: complicaciones tras cirugías estéticas siguen cobrando vidas de mujeres en República Dominicana (17 November 2026)', u: 'https://n.com.do/2026/11/17/al-menos-dos-mujeres-fallecen-tras-someterse-a-procedimientos-esteticos-durante-noviembre-en-rd/' },
  itvBbl: { t: 'ITV News: mum-of-five died after collapsing during Brazilian butt lift, inquest told (18 November 2026)', u: 'https://www.itv.com/news/westcountry/2026-11-18/mother-of-five-died-after-collapsing-during-brazilian-butt-lift-inquest-told' },
  sedKorea: { t: 'Seoul Economic Daily: Korean hotels cut rooms to make way for dermatology and plastic surgery clinics (19 November 2026)', u: 'https://en.sedaily.com/business/2026/11/19/korean-hotels-cut-rooms-to-make-way-for-dermatology-and' }
});

Object.assign(PAGES, {
  'tummy-tuck-cost': {
    taal: 'en', ingreep: 'tummy', naar: 'home', alt: 'tummy', published: '2026-11-19', updated: '2026-11-19',
    title: 'Tummy tuck cost in 2026: surgeon fee and insurance',
    h1: 'Tummy tuck cost: the surgeon fee, the full bill and who pays',
    desc: 'ASPS surgeon fees for a tummy tuck, UK, Dutch and German prices, when insurance or the NHS pays, recovery time and the risks. Independent, with sources.',
    kort: 'The American Society of Plastic Surgeons gives an average cost of $8,174 for a tummy tuck. That is the surgeon fee only: anesthesia, the operating room and other costs come on top. [aspsTummy] In the UK the NHS puts the price at about £5,000 to £10,000, and a tummy tuck is not usually available on the NHS. [nhsTummy]',
    secties: [
      { h: 'What it costs', p: [
        'United States: average surgeon fee $8,174, without anesthesia, operating room facilities or other related expenses. [aspsTummy]',
        'United Kingdom: about £5,000 to £10,000, according to the NHS. [nhsTummy]',
        'Netherlands: the Reinier de Graaf hospital charges EUR 4,750 for a small and EUR 7,550 for an extended tummy tuck in its 2026 price list for uninsured care. Repairing separated stomach muscles adds EUR 1,250. That is one hospital, not a national average. [rdgf2026]',
        'Germany: EUR 4,000 to 8,500, according to the health portal Dr. Gumpert. [gumpertBauch]',
        'Ask every clinic for one total price in writing: surgeon, anesthesia, operating room, overnight stay, garments, check-ups and the cost of a correction.'
      ] },
      { h: 'When insurance pays', p: [
        'US: most health insurance plans do not cover a tummy tuck or its complications. [aspsTummy]',
        'UK: a tummy tuck is regarded as cosmetic surgery, so it is not usually available on the NHS. [nhsTummy]',
        'Netherlands: basic insurance pays only with a medical need and permission in advance, for example when the skin apron covers at least a quarter of the thighs while standing. Back pain and stomach muscle separation are not reasons for payment. [zkWerkwijzer] [cbBuikwand]',
        'Germany: the statutory insurer pays only with a medical reason, such as repeated skin inflammation under an apron of skin, and you apply before surgery. After weight loss surgery the insurer does not pay automatically, ruled the Federal Social Court. [tonlineSchuerze] [aebBsg]'
      ] },
      { h: 'Recovery', p: [
        'The NHS says you need about 4 to 6 weeks off work and exercise, you cannot drive for a few weeks, and full recovery takes about 6 weeks. [nhsTummy]',
        'PHIN: avoid strenuous exercise such as weight lifting in the first month; after six weeks most people are back to their usual activities, including driving. [phinTummy]'
      ] },
      { h: 'Risks and timing', p: [
        'Mayo Clinic lists fluid under the skin (seroma), poor wound healing, a lasting scar along the swimsuit line, tissue damage and changes in skin sensation. [mayoTummy]',
        'A surgeon may advise against a tummy tuck if you plan to lose a lot of weight or are thinking about a future pregnancy. [mayoTummy]',
        'Going abroad for a cheaper price? Read the costs and risks per country first. [bapras]'
      ] }
    ],
    faq: [
      { q: 'How much does a tummy tuck cost?', a: 'ASPS gives an average surgeon fee of $8,174, without anesthesia and operating room. The NHS names about £5,000 to £10,000 in the UK. A Dutch hospital charges EUR 4,750 to 7,550 in 2026.' },
      { q: 'Does insurance pay for a tummy tuck?', a: 'Usually not. Most US health plans do not cover it and the NHS does not usually provide it. Dutch and German insurers pay only with a proven medical need and approval before surgery.' },
      { q: 'How long is the recovery after a tummy tuck?', a: 'According to the NHS you need about 4 to 6 weeks off work and exercise, and full recovery takes about 6 weeks.' },
      { q: 'Can I get pregnant after a tummy tuck?', a: 'Surgeons may advise against a tummy tuck if you are thinking about a future pregnancy, according to Mayo Clinic, because a pregnancy can undo the result.' }
    ],
    verwant: ['tummy-tuck-abroad-cost', 'nl/buikwandcorrectie-kosten', 'de/bauchdeckenstraffung-kosten', 'liposuction-cost']
  },
  'nl/buikwandcorrectie-kosten': {
    taal: 'nl', ingreep: 'tummy', naar: 'home', alt: 'tummy', published: '2026-11-19', updated: '2026-11-19',
    title: 'Buikwandcorrectie kosten 2026: prijs en vergoeding',
    h1: 'Buikwandcorrectie: wat het kost en wanneer de verzekering betaalt',
    desc: 'Wat een buikwandcorrectie kost bij Nederlandse ziekenhuizen, wanneer de basisverzekering vergoedt, het herstel en de risico\'s. Met bronnen.',
    kort: 'Het Reinier de Graaf ziekenhuis rekent in 2026 EUR 4.750 voor een kleine en EUR 7.550 voor een uitgebreide buikwandcorrectie, als je zelf betaalt. [rdgf2026] De basisverzekering vergoedt alleen bij medische noodzaak en met toestemming vooraf, en de vergoeding telt mee voor je eigen risico. [cbBuikwand]',
    secties: [
      { h: 'Wat het kost', p: [
        'Reinier de Graaf, prijslijst onverzekerde zorg 2026: kleine buikwandcorrectie EUR 4.750, uitgebreide buikwandcorrectie EUR 7.550, Fleur de Lis EUR 8.500. Het herstellen van uit elkaar geweken buikspieren (rectusdiastase) kost EUR 1.250 extra. Dat is één ziekenhuis, geen landelijk gemiddelde. [rdgf2026]',
        'Elkerliek Esthetiek, prijslijst van 2025: buikwandcorrectie met navel en overnachting EUR 5.400, mini buikwandcorrectie EUR 4.250. [elkerliek2025]',
        'De Consumentenbond schrijft dat de kosten beginnen bij een paar duizend euro en kunnen oplopen tot meer dan EUR 10.000. [cbBuikwand]',
        'Ter vergelijking: in de VS noemt de vereniging van plastisch chirurgen ASPS gemiddeld $8.174, alleen voor de chirurg. [aspsTummy]',
        'Vraag bij elke kliniek één totaalprijs op papier: chirurg, narcose, operatiekamer, overnachting, controles en wat een correctie kost.'
      ] },
      { h: 'Vergoeding', p: [
        'Een buikwandcorrectie wordt uit het basispakket vergoed als er medische noodzaak is. Je vraagt vooraf toestemming aan je zorgverzekeraar, en de vergoeding telt mee voor het eigen risico. [cbBuikwand]',
        'Zilveren Kruis noemt in zijn werkwijzer de voorwaarden. Je BMI is 30 of lager en minstens een jaar stabiel; na een maagverkleining mag je BMI hoogstens 35 zijn. Daarnaast moet één van deze drie gelden: de buikwand bedekt rechtop staand minstens een kwart van de bovenbenen, je hebt steeds terugkerende smetten die niet weggaan met behandeling, of er is een verminking. [zkWerkwijzer]',
        'Rugklachten en psychische klachten zijn geen reden voor vergoeding. Een rectusdiastase ook niet: er is weinig bewijs dat een buikwandcorrectie die klachten oplost. [zkWerkwijzer]',
        'In 2027 heeft alleen ONVZ met Topfit een aanvullende verzekering die plastische chirurgie vergoedt, en dan alleen als het medisch noodzakelijk is. [geldPlast]'
      ] },
      { h: 'Herstel', p: [
        'Volgens de Britse NHS heb je ongeveer 4 tot 6 weken nodig voor je weer werkt en sport, kun je een paar weken niet autorijden en ben je na ongeveer 6 weken hersteld. [nhsTummy]',
        'PHIN raadt aan de eerste maand zware inspanning zoals gewichtheffen te vermijden. [phinTummy]'
      ] },
      { h: 'Risico\'s en het goede moment', p: [
        'Mayo Clinic noemt vocht onder de huid (seroom), slechte wondgenezing, een blijvend litteken op de bikinilijn, weefselschade en een ander gevoel in de huid. [mayoTummy]',
        'Een chirurg kan afraden als je nog veel wilt afvallen of later nog zwanger wilt worden. [mayoTummy]',
        'Twijfel je over het buitenland vanwege de prijs? Lees eerst de kosten en risico\'s per land. [bapras]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een buikwandcorrectie?', a: 'Het Reinier de Graaf ziekenhuis rekent in 2026 EUR 4.750 voor een kleine en EUR 7.550 voor een uitgebreide buikwandcorrectie. Volgens de Consumentenbond kan het oplopen tot meer dan EUR 10.000.' },
      { q: 'Wanneer wordt een buikwandcorrectie vergoed?', a: 'Alleen bij medische noodzaak en met toestemming vooraf. Zilveren Kruis vraagt onder meer een stabiel BMI van 30 of lager en een buikwand die minstens een kwart van de bovenbenen bedekt, of smetten die niet weggaan.' },
      { q: 'Telt een buikwandcorrectie mee voor het eigen risico?', a: 'Ja. Als de basisverzekering vergoedt, telt dat mee voor je eigen risico, schrijft de Consumentenbond.' },
      { q: 'Wordt een buikwandcorrectie bij rectusdiastase vergoed?', a: 'Volgens de werkwijzer van Zilveren Kruis niet: er is weinig bewijs dat een buikwandcorrectie die klachten oplost.' },
      { q: 'Hoe lang duurt het herstel na een buikwandcorrectie?', a: 'Volgens de NHS ongeveer 4 tot 6 weken voor werk en sport, en ongeveer 6 weken tot je helemaal hersteld bent.' }
    ],
    verwant: ['nl/liposuctie-kosten', 'nl/beste-buikwandcorrectie-klinieken-tijuana-mexico', 'tummy-tuck-cost', 'tummy-tuck-abroad-cost']
  },
  'de/bauchdeckenstraffung-kosten': {
    taal: 'de', ingreep: 'tummy', naar: 'home', alt: 'tummy', published: '2026-11-19', updated: '2026-11-19',
    title: 'Bauchdeckenstraffung Kosten 2026: Preis und Krankenkasse',
    h1: 'Bauchdeckenstraffung: was sie kostet und wann die Krankenkasse zahlt',
    desc: 'Was eine Bauchdeckenstraffung kostet, wann die Krankenkasse bei einer Fettschürze zahlt, ein Urteil des BSG, Heilung und Risiken. Mit Quellen.',
    kort: 'Eine Bauchdeckenstraffung kostet laut dem Gesundheitsportal Dr. Gumpert zwischen 4.000 und 8.500 Euro. Sie gilt meist als ästhetischer Eingriff, die Krankenkasse zahlt dann nicht. [gumpertBauch] Bei einer medizinischen Indikation ist eine Übernahme möglich, wenn die Kasse vorher informiert wurde. [tonlineSchuerze]',
    secties: [
      { h: 'Was es kostet', p: [
        'Deutschland: zwischen 4.000 und 8.500 Euro, laut Dr. Gumpert. [gumpertBauch] Für eine Fettschürzen-OP nennt t-online je nach Aufwand bis zu 10.000 Euro. [tonlineSchuerze]',
        'Zum Vergleich Niederlande: Das Krankenhaus Reinier de Graaf berechnet 2026 für Selbstzahler 4.750 Euro für eine kleine und 7.550 Euro für eine ausgedehnte Bauchdeckenstraffung. Das ist ein Krankenhaus, kein Durchschnitt. [rdgf2026]',
        'USA: Die amerikanische Gesellschaft der plastischen Chirurgen ASPS nennt durchschnittlich 8.174 Dollar, nur für den Chirurgen, ohne Narkose und OP-Saal. [aspsTummy]',
        'Lassen Sie sich einen Gesamtpreis schriftlich geben: Chirurg, Narkose, OP-Saal, Übernachtung, Nachkontrollen und was eine Korrektur kostet.'
      ] },
      { h: 'Wann die Krankenkasse zahlt', p: [
        'Die (Teil-)Kosten einer Fettschürzen-OP werden meist nur bei einer medizinischen Indikation übernommen, etwa bei wiederholten Entzündungen unter der überschüssigen Haut. [tonlineSchuerze] [gumpertBauch]',
        'Eine Übernahme ist meist nur möglich, wenn die Kasse vor dem Eingriff informiert wurde und ihr eine ärztliche Bescheinigung und ein Kostenvoranschlag vorliegen. [tonlineSchuerze]',
        'Nach einer Magenverkleinerung zahlt die Kasse eine Hautstraffung nicht automatisch, sondern nur im Einzelfall aus medizinischen Gründen (Bundessozialgericht, B 1 KR 15/24 B). [aebBsg]',
        'Folgen Komplikationen nach einer medizinisch nicht nötigen Operation, kann die Kasse Sie an den Kosten beteiligen (§ 52 Abs. 2 SGB V). [bblVz]'
      ] },
      { h: 'Heilung', p: [
        'Laut dem britischen NHS brauchen Sie etwa 4 bis 6 Wochen Pause von Arbeit und Sport, können einige Wochen nicht Auto fahren und sind nach etwa 6 Wochen erholt. [nhsTummy]',
        'PHIN rät, im ersten Monat schwere Anstrengung wie Gewichtheben zu meiden. [phinTummy]'
      ] },
      { h: 'Risiken und der richtige Zeitpunkt', p: [
        'Mayo Clinic nennt Flüssigkeit unter der Haut (Serom), schlechte Wundheilung, eine bleibende Narbe an der Bikinilinie, Gewebeschäden und ein verändertes Hautgefühl. [mayoTummy]',
        'Ein Chirurg kann abraten, wenn Sie noch stark abnehmen wollen oder an eine spätere Schwangerschaft denken. [mayoTummy]',
        'Überlegen Sie eine OP im Ausland wegen des Preises? Lesen Sie zuerst Kosten und Risiken pro Land. [bapras]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Bauchdeckenstraffung?', a: 'Laut Dr. Gumpert zwischen 4.000 und 8.500 Euro. Eine Fettschürzen-OP kann laut t-online je nach Aufwand bis zu 10.000 Euro kosten.' },
      { q: 'Zahlt die Krankenkasse eine Bauchdeckenstraffung?', a: 'Nur bei einer medizinischen Indikation, etwa wiederholten Entzündungen unter einer Fettschürze, und meist nur, wenn die Kasse vorher mit ärztlicher Bescheinigung und Kostenvoranschlag informiert wurde.' },
      { q: 'Zahlt die Kasse nach einer Magenverkleinerung?', a: 'Nicht automatisch. Laut Bundessozialgericht nur im Einzelfall aus medizinischen Gründen.' },
      { q: 'Wie lange dauert die Heilung nach einer Bauchdeckenstraffung?', a: 'Laut NHS etwa 4 bis 6 Wochen ohne Arbeit und Sport und etwa 6 Wochen bis zur vollen Erholung.' }
    ],
    verwant: ['de/fettabsaugung-kosten', 'de/beste-bauchdeckenstraffung-kliniken-tijuana-mexiko', 'tummy-tuck-cost', 'tummy-tuck-abroad-cost']
  }
});
PAGES['tummy-tuck-abroad-cost'].verwant.push('tummy-tuck-cost');

// Gids neuscorrectie (20 nov 2026, dagronde): grootste kostenvraag zonder eigen gids (Demand Radar 16 nov: US rhinoplasty
// 90.500 per maand, NL neuscorrectie 2.400, neuscorrectie prijs 880). Elk feit is op 20 november 2026 op de bronpagina gelezen.
// Een Nederlandse ziekenhuisprijs voor 2026 is niet gevonden (Reinier de Graaf en Elkerliek noemen geen neuscorrectie);
// Slingeland 2023 staat er als zodanig. Voor Turkije is geen onafhankelijke prijs gevonden, dus geen buitenlandprijs.
Object.assign(SRC, {
  capitalTr: { t: 'Capital: Estetikte karlılık düşüyor, klinikler kapanıyor (20 November 2026)', u: 'https://www.capital.com.tr/haberler/tum-haberler/estetikte-karlilik-dusuyor-klinikler-kapaniyor' },
  mxNuevoLaredo: { t: 'Impacto Noticias: Fiscalía investiga muerte de mujer tras someterse a cirugía estética en Tamaulipas (19 November 2026)', u: 'https://impactonoticias.com.mx/mexico/fiscalia-investiga-muerte-de-mujer-tras-someterse-a-cirugia-estetica-en-tamaulipas/' },
  aspsRhino: { t: 'ASPS: rhinoplasty cost (average surgeon fee)', u: 'https://www.plasticsurgery.org/cosmetic-procedures/rhinoplasty/cost' },
  nhsRhino: { t: 'NHS: nose reshaping (rhinoplasty), reviewed 22 September 2023', u: 'https://www.nhs.uk/conditions/cosmetic-procedures/cosmetic-surgery/nose-reshaping-rhinoplasty/' },
  mayoRhino: { t: 'Mayo Clinic: rhinoplasty (2 October 2024)', u: 'https://www.mayoclinic.org/tests-procedures/rhinoplasty/about/pac-20384532' },
  slingeland2023: { t: 'Slingeland Ziekenhuis: prijslijst plastische chirurgie januari 2023', u: 'https://plastischechirurgie.slingeland.nl/wms/fm/userfiles/content/attachments/prijslijstplastische-chirurgiejanuari-2023.pdf' },
  cbPlastisch: { t: 'Consumentenbond: vergoeding plastische chirurgie 2027', u: 'https://www.consumentenbond.nl/zorgverzekering/vergoedingen/plastische-chirurgie' },
  jbzNeus: { t: 'Jeroen Bosch Ziekenhuis: neuscorrectie door de plastisch chirurg (herzien 6 november 2026)', u: 'https://www.jeroenboschziekenhuis.nl/behandelingen/neuscorrectie-door-de-plastisch-chirurg/pdf' },
  znNeus: { t: 'Zorgverzekeraars Nederland: machtigingsformulier neuscorrectie (X03)', u: 'https://www.vecozo.nl/globalassets/documenten--downloads/diensten/machtigingenportaal/formulieren-medisch-specialisten/x03-neuscorrectie.pdf' },
  gumpertNase: { t: 'Dr. Gumpert: Kosten einer Nasenkorrektur (geändert 22.10.2021)', u: 'https://www.dr-gumpert.de/html/nasenkorrektur_kosten.html' },
  khNase: { t: 'krankenhaus.de: Nasenkorrektur, was kostet sie und wie läuft sie ab?', u: 'https://www.krankenhaus.de/behandlungen/nasenkorrektur-was-kostet-sie-und-wie-laeuft-sie-ab/' },
  gumpertSeptum: { t: 'Dr. Gumpert: OP einer Nasenscheidewandverkrümmung (aktualisiert 18.09.2024)', u: 'https://www.dr-gumpert.de/html/op_einer_nasenscheidewandverkruemmung.html' }
});

Object.assign(PAGES, {
  'rhinoplasty-cost': {
    taal: 'en', ingreep: 'rhinoplasty', naar: 'home', alt: 'rhinoplasty', published: '2026-11-20', updated: '2026-11-20',
    title: 'Rhinoplasty cost in 2026: surgeon fee and insurance',
    h1: 'Rhinoplasty cost: the surgeon fee, the full bill and who pays',
    desc: 'ASPS surgeon fee for a nose job, UK, Dutch and German prices, when insurance pays for breathing problems, recovery and risks. Independent, with sources.',
    kort: 'The American Society of Plastic Surgeons gives an average cost of $7,637 for rhinoplasty. That is the surgeon fee only: anesthesia, the operating room and other costs come on top. [aspsRhino] In the UK the NHS puts the price at £4,000 to £7,000, and nose reshaping is not usually available on the NHS for cosmetic reasons. [nhsRhino]',
    secties: [
      { h: 'What it costs', p: [
        'United States: average surgeon fee $7,637, without anesthesia, operating room facilities or other related expenses. [aspsRhino]',
        'United Kingdom: £4,000 to £7,000, according to the NHS. Consultations, further surgery and follow-up care can cost extra. [nhsRhino]',
        'Netherlands: the Slingeland hospital listed a nose correction from EUR 3,500 in its January 2023 price list. We found no Dutch hospital price for 2026. [slingeland2023]',
        'Germany: EUR 2,000 to 8,000 including follow-up visits, according to the health portal Dr. Gumpert, and EUR 3,000 to 5,000 according to krankenhaus.de. [gumpertNase] [khNase]',
        'Ask every clinic for one total price in writing: surgeon, anesthesia, operating room, splint, check-ups and what a correction costs.'
      ] },
      { h: 'When insurance pays', p: [
        'UK: the NHS does not usually pay for cosmetic reasons, but it may fund surgery that is needed to help you breathe. [nhsRhino]',
        'Netherlands: basic insurance pays only with a medical need. A Dutch hospital writes that a nose correction is generally paid only if the shape of your nose stops you breathing well. [cbPlastisch] [jbzNeus]',
        'The Dutch insurers\' approval form asks for a blocked nose for more than 12 months with a clear anatomical cause, at least 4 weeks of medicine tried first, photos and an ENT report. If surgery on the septum alone would be enough, the request can be refused. [znNeus]',
        'Germany: statutory insurers pay for a functional correction, for example when breathing through the nose is blocked, but not for cosmetic reasons alone. [gumpertSeptum] [khNase]'
      ] },
      { h: 'Recovery', p: [
        'The NHS says you wear a splint taped over your nose for 7 days and may need up to 2 weeks off work. Bruising and swelling may have faded after 3 weeks. [nhsRhino]',
        'Swelling can take up to 6 months to go completely, according to the NHS; Mayo Clinic says nose swelling can last up to a year. [nhsRhino] [mayoRhino]'
      ] },
      { h: 'Risks', p: [
        'The NHS lists permanent breathing difficulty, damage to the cartilage wall between the nostrils, an altered sense of smell and heavy nosebleeds. [nhsRhino]',
        'Mayo Clinic adds permanent numbness in and around the nose, an uneven look, scarring and a hole in the septum. If you need a second operation, you must wait at least a year. [mayoRhino]'
      ] }
    ],
    faq: [
      { q: 'How much does a rhinoplasty cost?', a: 'ASPS gives an average surgeon fee of $7,637, without anesthesia and operating room. The NHS names £4,000 to £7,000 in the UK. German health portals name EUR 2,000 to 8,000.' },
      { q: 'Does insurance pay for a nose job?', a: 'Not for cosmetic reasons. The NHS may fund surgery needed for breathing. Dutch and German insurers pay only with a proven medical need, such as a blocked nose with an anatomical cause.' },
      { q: 'How long is the recovery after rhinoplasty?', a: 'According to the NHS you wear a splint for 7 days and may need up to 2 weeks off work. Swelling can take 6 months to a year to go.' },
      { q: 'When can I have a revision rhinoplasty?', a: 'Mayo Clinic says you must wait at least a year before a follow-up operation.' }
    ],
    verwant: ['nl/neuscorrectie-kosten', 'de/nasenkorrektur-kosten', 'eyelid-surgery-cost']
  },
  'nl/neuscorrectie-kosten': {
    taal: 'nl', ingreep: 'rhinoplasty', naar: 'home', alt: 'rhinoplasty', published: '2026-11-20', updated: '2026-11-20',
    title: 'Neuscorrectie kosten 2026: prijs en vergoeding',
    h1: 'Neuscorrectie: wat het kost en wanneer de verzekering betaalt',
    desc: 'Wat een neuscorrectie kost, wanneer de basisverzekering vergoedt bij ademhalingsklachten, wat verzekeraars vragen, het herstel en de risico\'s. Met bronnen.',
    kort: 'Een neuscorrectie wordt alleen vergoed als de stand van je neus je ademhaling hindert; om cosmetische redenen betaal je zelf. [jbzNeus] [cbPlastisch] Een recente Nederlandse ziekenhuisprijs vonden we niet: Slingeland noemde in 2023 vanaf EUR 3.500. [slingeland2023] In de VS rekent een chirurg gemiddeld $7.637, zonder narcose en operatiekamer. [aspsRhino]',
    secties: [
      { h: 'Wat het kost', p: [
        'Slingeland Ziekenhuis, prijslijst januari 2023: neuscorrectie vanaf EUR 3.500, onder narcose in dagopname. Voor 2026 vonden we geen Nederlandse ziekenhuisprijs. [slingeland2023]',
        'Duitsland: EUR 2.000 tot 8.000 inclusief nacontroles volgens Dr. Gumpert, EUR 3.000 tot 5.000 volgens krankenhaus.de. [gumpertNase] [khNase]',
        'Verenigd Koninkrijk: £4.000 tot £7.000 volgens de NHS. [nhsRhino] Verenigde Staten: gemiddeld $7.637, alleen voor de chirurg. [aspsRhino]',
        'Vraag bij elke kliniek één totaalprijs op papier: chirurg, narcose, operatiekamer, spalk, controles en wat een correctie kost.'
      ] },
      { h: 'Vergoeding', p: [
        'Plastische chirurgie wordt alleen uit de basisverzekering vergoed bij medische noodzaak, en je hebt altijd een verwijzing nodig van de huisarts of een medisch specialist. [cbPlastisch]',
        'Het Jeroen Bosch Ziekenhuis schrijft dat een neuscorrectie in het algemeen alleen vergoed wordt als je door de stand van je neus niet goed kunt ademhalen. [jbzNeus]',
        'Het machtigingsformulier van de zorgverzekeraars vraagt een verstopte neus die langer dan 12 maanden bestaat, met een duidelijke anatomische afwijking (aangeboren, ongeval of ziekte), minstens 4 weken medicijnen geprobeerd, foto\'s en een verslag van de KNO-arts. [znNeus]',
        'Op hetzelfde formulier staat de vraag of een operatie aan alleen het neustussenschot genoeg is. Is dat zo, dan kan de aanvraag worden afgewezen. Een ernstige misvorming telt ook, als die komt door ziekte, een ongeval of een eerdere behandeling. [znNeus]'
      ] },
      { h: 'Herstel', p: [
        'Volgens de NHS zit er 7 dagen een spalk op je neus en heb je tot 2 weken vrij nodig. Na 3 weken zijn blauwe plekken en zwelling meestal weg. [nhsRhino]',
        'Het Jeroen Bosch Ziekenhuis noemt licht werk na ongeveer een week en sporten en zwemmen na ongeveer 6 weken. [jbzNeus]',
        'De laatste zwelling kan tot 6 maanden duren volgens de NHS, tot een jaar volgens Mayo Clinic. [nhsRhino] [mayoRhino]'
      ] },
      { h: 'Risico\'s', p: [
        'De NHS noemt blijvende ademhalingsproblemen, schade aan het tussenschot, een veranderde reuk en hevige neusbloedingen. [nhsRhino]',
        'Mayo Clinic noemt ook een blijvend doof gevoel rond de neus, een ongelijk resultaat, littekens en een gaatje in het tussenschot. Voor een tweede operatie moet je minstens een jaar wachten. [mayoRhino]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een neuscorrectie?', a: 'Een Nederlandse ziekenhuisprijs voor 2026 vonden we niet; Slingeland noemde in 2023 vanaf EUR 3.500. In Duitsland noemen gezondheidssites EUR 2.000 tot 8.000.' },
      { q: 'Wordt een neuscorrectie vergoed?', a: 'Alleen als de stand van je neus je ademhaling hindert, met een verwijzing en toestemming vooraf. Om cosmetische redenen betaal je zelf.' },
      { q: 'Wat vraagt de verzekeraar voor een neuscorrectie?', a: 'Een verstopte neus die langer dan 12 maanden bestaat met een anatomische oorzaak, minstens 4 weken medicijnen, foto\'s en een verslag van de KNO-arts.' },
      { q: 'Hoe lang duurt het herstel na een neuscorrectie?', a: 'Een week een spalk, tot 2 weken vrij en sporten na ongeveer 6 weken. De laatste zwelling kan tot een jaar duren.' }
    ],
    verwant: ['nl/ooglidcorrectie-kosten', 'rhinoplasty-cost', 'de/nasenkorrektur-kosten']
  },
  'de/nasenkorrektur-kosten': {
    taal: 'de', ingreep: 'rhinoplasty', naar: 'home', alt: 'rhinoplasty', published: '2026-11-20', updated: '2026-11-20',
    title: 'Nasenkorrektur Kosten 2026: Preis und Krankenkasse',
    h1: 'Nasenkorrektur: was sie kostet und wann die Krankenkasse zahlt',
    desc: 'Was eine Nasenkorrektur kostet, wann die Krankenkasse bei Atemproblemen zahlt, was bei der Nasenscheidewand gilt, Heilung und Risiken. Mit Quellen.',
    kort: 'Eine Nasenkorrektur kostet laut dem Gesundheitsportal Dr. Gumpert zwischen 2.000 und 8.000 Euro einschließlich Nachkontrollen, krankenhaus.de nennt 3.000 bis 5.000 Euro. [gumpertNase] [khNase] Bei einer funktionellen Korrektur übernimmt die Krankenkasse in der Regel die Kosten, aus rein kosmetischen Gründen nicht. [khNase] [gumpertSeptum]',
    secties: [
      { h: 'Was es kostet', p: [
        'Deutschland: zwischen 2.000 und 8.000 Euro einschließlich Nachkontrollen laut Dr. Gumpert, 3.000 bis 5.000 Euro laut krankenhaus.de. [gumpertNase] [khNase]',
        'Großbritannien: 4.000 bis 7.000 Pfund laut NHS. [nhsRhino] USA: durchschnittlich 7.637 Dollar, nur für den Chirurgen, ohne Narkose und OP-Saal. [aspsRhino]',
        'Lassen Sie sich einen Gesamtpreis schriftlich geben: Chirurg, Narkose, OP-Saal, Schiene, Nachkontrollen und was eine Korrektur kostet.'
      ] },
      { h: 'Wann die Krankenkasse zahlt', p: [
        'Bei einer funktionellen Nasenkorrektur übernimmt die Krankenkasse in der Regel die Kosten. [khNase]',
        'Bei einer verkrümmten Nasenscheidewand zahlt die Kasse, wenn eine funktionelle Beeinträchtigung vorliegt, etwa eine behinderte Nasenatmung. Rein kosmetische Gründe zählen nicht. [gumpertSeptum]',
        'Wird bei einer ästhetischen Korrektur zugleich die Nasenscheidewand gerichtet, zahlt die Kasse laut Dr. Gumpert zumindest einen Teil der Kosten. [gumpertNase]',
        'Folgen Komplikationen nach einer medizinisch nicht nötigen Operation, kann die Kasse Sie an den Kosten beteiligen (§ 52 Abs. 2 SGB V). [bblVz]'
      ] },
      { h: 'Heilung', p: [
        'Laut NHS tragen Sie 7 Tage eine Schiene auf der Nase und brauchen bis zu 2 Wochen Pause von der Arbeit. Nach 3 Wochen sind Blutergüsse und Schwellung meist abgeklungen. [nhsRhino]',
        'Die letzte Schwellung kann laut NHS bis zu 6 Monate dauern, laut Mayo Clinic bis zu einem Jahr. [nhsRhino] [mayoRhino]'
      ] },
      { h: 'Risiken', p: [
        'Der NHS nennt dauerhafte Atemprobleme, Schäden an der Nasenscheidewand, einen veränderten Geruchssinn und starkes Nasenbluten. [nhsRhino]',
        'Mayo Clinic nennt außerdem dauerhafte Taubheit um die Nase, ein ungleichmäßiges Ergebnis, Narben und ein Loch in der Nasenscheidewand. Für eine zweite Operation müssen Sie mindestens ein Jahr warten. [mayoRhino]'
      ] }
    ],
    faq: [
      { q: 'Was kostet eine Nasenkorrektur?', a: 'Laut Dr. Gumpert zwischen 2.000 und 8.000 Euro einschließlich Nachkontrollen, laut krankenhaus.de 3.000 bis 5.000 Euro.' },
      { q: 'Zahlt die Krankenkasse eine Nasenkorrektur?', a: 'Bei einer funktionellen Korrektur, etwa einer behinderten Nasenatmung, in der Regel ja. Aus rein kosmetischen Gründen nicht.' },
      { q: 'Zahlt die Kasse, wenn zugleich die Nasenscheidewand gerichtet wird?', a: 'Laut Dr. Gumpert übernimmt die Kasse dann zumindest einen Teil der Kosten.' },
      { q: 'Wie lange dauert die Heilung nach einer Nasenkorrektur?', a: 'Laut NHS 7 Tage Schiene und bis zu 2 Wochen ohne Arbeit. Die letzte Schwellung kann bis zu einem Jahr dauern.' }
    ],
    verwant: ['de/fettabsaugung-kosten', 'rhinoplasty-cost', 'nl/neuscorrectie-kosten']
  }
});
for (const [s, v] of [['eyelid-surgery-cost', 'rhinoplasty-cost'], ['nl/ooglidcorrectie-kosten', 'nl/neuscorrectie-kosten']]) PAGES[s].verwant.push(v);
