// True Surgery Cost (Henkjan 14 nov 2026: "wereldwijd aanpakken ... gekeken vanuit een bepaald land naar de landen waar je heen kunt ... ASAP mentions in AI assistents").
// Alleen feiten met bron. Bronnen van klinieken of bemiddelaars staan gemarkeerd als commercial: true.
// Routekaart (herkomst -> bestemming) met bewijs: data/tsc-routes.json. Zoekvraag gemeten 14 nov 2026 in Keyword Planner (US: hair transplant turkey 27.100/mnd, tummy tuck cost 33.100/mnd).

// Henkjan 14 nov 2026: "Nee niet kopen . Wil naam laten marineren": voorlopig op todayin.email/surgery (zelfde merk als de ochtendmail).
export const SITE = { name: 'todayin surgery', base: 'https://todayin.email/surgery', host: 'todayin.email', updated: '2026-11-15' };

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
  zorgwijzer2027: { t: 'Zorgwijzer: zorgverzekering 2027, premies', u: 'https://www.zorgwijzer.nl/zorgverzekering-2027' }
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
    taal: 'en', ingreep: 'eyelid', naar: 'home',
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
    taal: 'nl', ingreep: 'eyelid', naar: 'home',
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
        'Van de eerste drie verzekeraars die hun polissen voor 2027 bekendmaakten (DSW, Salland en Stad Holland) biedt geen enkele een aanvullende verzekering die een bovenooglidcorrectie dekt. De premies van de andere verzekeraars komen uiterlijk 19 november. [consBondOog]'
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
      { q: 'Welke aanvullende verzekering vergoedt een ooglidcorrectie in 2027?', a: 'Van DSW, Salland en Stad Holland geen enkele. De polissen van de andere verzekeraars komen uiterlijk 19 november; we werken deze pagina dan bij.' }
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
        'Van de eerste verzekeraars met polissen voor 2027 (DSW, Salland en Stad Holland) heeft geen enkele een aanvullende verzekering die plastische chirurgie dekt. Uiterlijk 19 november zijn alle aanvullende dekkingen bekend. [consPlast]'
      ] },
      { h: 'Naar het buitenland', p: [
        'Volgens het EVZ is een liposuctie in het buitenland vaak tot twee derde goedkoper dan in Duitsland, met grote verschillen per land. Reis, hotel en mogelijke annuleringskosten komen erbij, en een aanbetaling krijg je soms niet terug. [evzLipo]'
      ] }
    ],
    faq: [
      { q: 'Wat kost een liposuctie?', a: 'In Nederland ongeveer EUR 1.000 tot 2.000 per behandeling volgens Geld.nl. In Duitsland gemiddeld EUR 2.500 tot 7.000 volgens het EVZ.' },
      { q: 'Wordt liposuctie vergoed?', a: 'Alleen bij een medische noodzaak. Voor je uiterlijk nooit. Wordt het uit de basisverzekering vergoed, dan telt je eigen risico mee.' },
      { q: 'Wordt liposuctie bij lipoedeem vergoed?', a: 'Het Zorginstituut oordeelde in mei 2022 dat het (nog) niet in het basispakket kan. In Duitsland betaalt de wettelijke verzekering het sinds 2025 wel, onder strenge voorwaarden.' },
      { q: 'Welke aanvullende verzekering vergoedt liposuctie in 2027?', a: 'Van DSW, Salland en Stad Holland dekt geen enkele aanvullende verzekering plastische chirurgie. De rest is uiterlijk 19 november bekend; we werken deze pagina dan bij.' }
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
  }
};


// Chirurg controleren per bestemming
export const CHECK = {
  turkey: { land: 'Turkey', kort: 'HealthTurkiye lists licensed clinics and agencies, not surgeons. Check the clinic there, then ask for the named surgeon and check their specialist title with the Turkish Medical Association and the plastic surgery society TPRECD.', stappen: ['Find the clinic and agency on HealthTurkiye. [healthturkiye]', 'Ask for the full name of the operating surgeon in writing.', 'Check the specialist title with the Turkish Medical Association (ttb.org.tr) and membership of TPRECD (plastikcerrahi.org.tr).', 'Ask for the complication insurance that is mandatory for surgery since the April 2025 regulation. [mondaqTr]'], risico: ['The UK FCDO reports 7 British deaths after medical procedures in Turkey in 2025. [fcdoTr]', '87 cases of botulism followed intragastric botox for weight loss in Istanbul and Izmir in 2023. [ecdcBot]'] },
  mexico: { land: 'Mexico', kort: 'A Mexican plastic surgeon needs a specialist licence (cedula de especialista) and certification by the Consejo Mexicano de Cirugia Plastica (CMCPER). One surgeon claimed in 2025 that only about 2,690 of those operating are certified.', stappen: ['Look up the cedula de especialista on cedulaprofesional.sep.gob.mx.', 'Check CMCPER certification on cmcper.org.mx.', 'Ask who gives the anaesthesia and where you go if something goes wrong.', 'Complaints go to CONAMED. [conamed]'], risico: ['12 patients died of fungal meningitis after epidurals in two clinics in Matamoros in 2023. [cidrap]', 'Claim: about 2,690 certified plastic surgeons against about 25,000 non-specialists doing cosmetic surgery (one surgeon, Oct 2025). [mxSpec]'] },
  colombia: { land: 'Colombia', kort: 'Check the surgeon in the national register ReTHUS and membership of the plastic surgery society SCCP, then check that the clinic is licensed (habilitada) and has an anaesthesiologist present.', stappen: ['Check registration in ReTHUS. [colombiaCheck]', 'Check SCCP membership (cirugiaplastica.org.co).', 'Ask for the clinic\'s habilitacion and the surgeon\'s liability insurance.', 'Under 18s may not have cosmetic surgery (Law 1799 of 2016). [ley1799]'], risico: ['Antioquia counted 125 serious complications from illegal procedures in January to October 2024, and at least 14 deaths. [antioquia]'] },
  'dominican-republic': { land: 'Dominican Republic', kort: 'Choose a surgeon certified by SODOCIPRE, the Dominican plastic surgery society. Since 2019 the health ministry limits operations to two major procedures at a time.', stappen: ['Check SODOCIPRE certification (sodocipre.net). [sodocipre]', 'Refuse a package with more than two major procedures in one operation. [cdcDr]', 'Ask where you recover: a recovery house is not a hospital.'], risico: ['93 US citizens died after cosmetic surgery in the Dominican Republic from 2009 to 2022 (CDC). [cdcDr]', '82.7% of 214 US-treated cosmetic tourism complications came from the Dominican Republic. [springerDr]'] },
  thailand: { land: 'Thailand', kort: 'The Thai Medical Council has a public doctor check that shows licence, specialty and any suspension. Thailand has about 60 JCI-accredited hospitals.', stappen: ['Look up the doctor on checkmd.tmc.or.th. [thaiCheck]', 'Prefer a hospital with JCI or national HA accreditation. [thaiJci]', 'Australians: Medicare does not cover you overseas. [smartraveller]'], risico: ['At one Brisbane hospital, 6 of 8 patients treated for complications of overseas breast implants had been operated in Thailand. [rbwh]'] },
  'south-korea': { land: 'South Korea', kort: 'Korea has no public list of doctors. Ask for the specialist certificate and check membership of the Korean Society of Plastic and Reconstructive Surgeons. You can ask for CCTV recording in the operating room.', stappen: ['Ask for the board certificate in plastic surgery.', 'Check KSPRS membership (plasticsurgery.or.kr).', 'Ask for CCTV recording during surgery under anaesthesia: mandatory on request since 2023. [koreaCctv]'], risico: ['1.17 million foreign patients came to Korea in 2024, 11.4% for plastic surgery. [koreaVol]'] }
};


// Only pages whose sourced text changed receive this modification date.
for (const page of Object.values(PAGES)) if (['hair','lipo'].includes(page.ingreep)) page.updated = '2026-11-15';
