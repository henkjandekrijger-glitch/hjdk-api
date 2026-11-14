// True Surgery Cost (Henkjan 14 nov 2026: "wereldwijd aanpakken ... gekeken vanuit een bepaald land naar de landen waar je heen kunt ... ASAP mentions in AI assistents").
// Alleen feiten met bron. Bronnen van klinieken of bemiddelaars staan gemarkeerd als commercial: true.
// Routekaart (herkomst -> bestemming) met bewijs: data/tsc-routes.json. Zoekvraag gemeten 14 nov 2026 in Keyword Planner (US: hair transplant turkey 27.100/mnd, tummy tuck cost 33.100/mnd).

export const SITE = { name: 'True Surgery Cost', host: 'truesurgerycost.com', updated: '2026-11-14' };

export const SRC = {
  evz: { t: 'EVZ (European Consumer Centre Germany): hair transplants abroad', u: 'https://www.evz.de/themen/gesundheit/kosmetische-behandlungen/haartransplantatie/' },
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
  ecdcBot: { t: 'ECDC: botulism after intragastric botox in Turkey, 2023', u: 'https://www.ecdc.europa.eu/en/news-events/botulism-iatrogenic-update-cases-europe-march-2023' }
};

// Thuisland: munt en standaardwaarden voor de rekenhulp (schattingen die de lezer zelf aanpast; geen bron nodig, het zijn invulvelden)
export const HOME = {
  us: { label: 'United States', cur: '$', flight: 900, night: 90 },
  uk: { label: 'United Kingdom', cur: '£', flight: 250, night: 70 },
  ca: { label: 'Canada', cur: 'C$', flight: 1100, night: 110 },
  au: { label: 'Australia', cur: 'A$', flight: 1200, night: 110 }
};

export const PAGES = {
  'hair-transplant-turkey': {
    title: 'Hair transplant in Turkey: true cost and how to check the clinic (2026)',
    h1: 'Hair transplant in Turkey: what it really costs, and how to check who operates',
    desc: 'Turkey vs home prices from the German consumer centre, the full trip cost, the 2025 Turkish rules and the five checks that matter. Independent, with sources.',
    kort: 'A hair transplant in Turkey costs about a third of the price at home: the German consumer centre EVZ lists about EUR 2,400 in Turkey against EUR 6,800 in Germany. The real risk is not the country but who operates: the ISHRS warns that in many clinics technicians, not doctors, do the surgery. Ask in writing which named doctor does which step, check the clinic on HealthTurkiye, and judge results at 12 months, not week one.',
    calc: { proc: 'hair transplant', abroad: { us: 2700, uk: 2300, ca: 3600, au: 4100 }, home: { us: 13600, uk: 9500, ca: 15000, au: 15000 }, nights: 3, extras: { us: 150, uk: 120, ca: 180, au: 200 } },
    secties: [
      { h: 'What it costs', p: [
        'The German consumer centre EVZ compared prices for one hair transplant: about EUR 6,800 in Germany, EUR 5,200 in Poland, EUR 3,400 in Hungary and EUR 2,400 in Turkey. [evz]',
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
      { q: 'How much is a hair transplant in Turkey?', a: 'About EUR 2,400 according to the German consumer centre EVZ, against about EUR 6,800 in Germany. Clinic packages with hotel and transfers are often GBP 2,000 to 4,000, according to UK price comparisons.' },
      { q: 'Is a hair transplant in Turkey safe?', a: 'It can be, if a qualified doctor does the surgery. The main risk the ISHRS warns about is technicians operating instead of doctors. Ask in writing who does each step and check the clinic on HealthTurkiye.' },
      { q: 'How long do I need to stay in Turkey?', a: 'Usually 3 to 4 days: the procedure, a check the next day and the first wash.' },
      { q: 'What changed in Turkey in 2025?', a: 'A regulation of 26 April 2025 made complication insurance mandatory for surgery and requires licensed intermediaries with a 24/7 call centre.' }
    ],
    verwant: ['check-surgeon-turkey', 'tummy-tuck-abroad-cost']
  },
  'tummy-tuck-abroad-cost': {
    title: 'Tummy tuck abroad: true cost vs home, with the risks in numbers (2026)',
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
