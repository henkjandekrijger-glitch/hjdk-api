// Met de hand geschreven gidsen voor whichtobuy.best (us) en kaufberater.best (de), zelfde vorm als api/wtbmaak.js schrijf():
// slug, term, cat, title, h1, seoTitle, metaDesc, intro, kort, questions [{q, options [{label, kw, min, max}]}] (3 vragen, laatste = budget),
// guide (alinea's gescheiden door \n), mistakes [], aiMiss [], faq [{q, a}], vanaf (publiceren vanaf die dag), v (versie: hoger = opnieuw publiceren).
// Waarom met de hand: Henkjan "werk dat ik zelf kan doen, doe ik zelf" (geen AI Gateway). Publiceren: /api/wtbmaak?op=hand (&dry=1, &m=us|de, &slug=).
// Feiten alleen met bron (fabrikant, test) en met datum; geen verzonnen tests, prijzen of scores. Geen gedachtestreepjes.
// 3D-printers (10 nov 2026, feiten: fabrikant, Tom's Hardware, Galaxus-prijzen 10 nov)
const US3D = {
  slug: 'bambu-lab-a1-vs-p1s-vs-p2s-which-to-buy-2026', term: '3d printer', cat: 'Electronics', vanaf: '2026-11-10', v: 1,
  title: 'Bambu Lab A1, P1S or P2S: which one should you buy?', h1: 'Bambu Lab A1 vs P1S vs P2S (and the alternatives): which 3D printer to buy in 2026',
  seoTitle: 'Bambu Lab A1 vs P1S vs P2S: which to buy (2026)', metaDesc: 'Open or enclosed, one color or four, PLA or ABS? Answer 3 questions and see which Bambu Lab printer, or Creality, Elegoo or Prusa alternative, fits you.',
  intro: 'Bambu Lab sells three printers that most beginners compare: the open A1 (and A1 mini), the enclosed P1S and its 2025 successor the P2S. The right pick depends on what you print, which materials you use and whether you want more than one color.',
  kort: 'For PLA and PETG at home, the open Bambu Lab A1 (256 mm cube) is the easiest start; the A1 mini (180 mm) if space or budget is tight. If you want ABS or ASA, or a quieter, closed machine in a living space, pick the enclosed P2S over the older P1S. Add the Combo (4-spool color unit) only if you really want multi-color prints.',
  questions: [
    { q: 'What will you print most?', options: [
      { label: 'Toys, gadgets and household parts in PLA', kw: 'bambu lab a1', min: null, max: null },
      { label: 'Strong or heat-resistant parts in ABS or ASA', kw: 'enclosed bambu lab p2s', min: null, max: null },
      { label: 'Large prints over 300 mm', kw: 'large build volume enclosed', min: null, max: null } ] },
    { q: 'How many colors in one print?', options: [
      { label: 'One color is fine', kw: '', min: null, max: null },
      { label: 'Up to four colors', kw: 'combo ams', min: null, max: null },
      { label: 'Not sure yet', kw: '', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $300', kw: '', min: null, max: 300 },
      { label: '$300 to $700', kw: '', min: 300, max: 700 },
      { label: 'Over $700', kw: '', min: 700, max: null } ] } ],
  guide: 'Build size first. The A1 mini prints up to 180 x 180 x 180 mm, enough for keychains, holders and small parts. The A1, P1S, P2S, Elegoo Centauri Carbon and Anycubic Kobra S1 all print about 250 to 256 mm per side, which covers boxes, organizers and most cosplay pieces. Only the Bambu Lab H2D (350 x 320 x 325 mm) and Creality K2 Plus (350 mm cube) go much bigger.\nOpen or enclosed. The A1 and A1 mini are open bed-slingers: great for PLA, PETG and TPU, not recommended by Bambu for ABS, ASA or carbon-filled filament. The P1S and P2S are enclosed, so warping and fumes are easier to control. The P2S (reviewed by Tom\'s Hardware in October 2025) adds a 1080p camera with AI failure detection and the AMS 2 Pro color unit.\nMulti-color. A Combo adds a 4-spool unit (AMS lite on the A1 series, AMS on the P-series, CFS on Creality, ACE Pro on Anycubic). Multi-color prints take longer and create purge waste, so buy it for a reason, not by default.\nCalibration. Every printer here levels its own bed and compensates vibration, which is the main reason beginners now succeed in the first hour.\nSoftware. Since January 2025 Bambu Lab requires its own authorization for remote control, also in LAN mode, with a separate Developer Mode for third-party tools. Printing from the SD card keeps working. If you want a fully open ecosystem, look at Prusa (Core One, MK4S).',
  mistakes: ['Printing ABS or ASA on an open printer in a bedroom or living room.', 'Buying the A1 mini for parts that need more than 18 cm.', 'Paying for a 4-color unit you will only use for a few prints.', 'Still shopping for the X1 Carbon: Bambu ended it on March 31, 2026.'],
  aiMiss: ['Many answers still recommend the P1S as the newest enclosed Bambu; the P2S replaced it in late 2025.', 'Older advice suggests the X1 Carbon as the premium pick; Bambu Lab declared it end of life on March 31, 2026 (parts until 2031).', 'Generic answers skip the 2025 firmware change: remote control now needs Bambu authorization, also in LAN mode.'],
  faq: [
    { q: 'Is the Bambu Lab A1 good for beginners?', a: 'Yes. It calibrates itself, prints PLA, PETG and TPU, and Tom\'s Hardware called it a reliable and quiet high-speed printer at a competitive price.' },
    { q: 'What is the difference between the Bambu Lab P1S and P2S?', a: 'Both are enclosed with a 256 mm build volume. The P2S is the 2025 successor with a 1080p AI camera, a higher top speed (600 mm/s) and the AMS 2 Pro color unit.' },
    { q: 'Can the Bambu Lab A1 print ABS?', a: 'Bambu Lab does not recommend ABS, ASA, PC or carbon-filled filament on the A1 or A1 mini. Use an enclosed printer for those.' },
    { q: 'Is the Bambu Lab X1 Carbon discontinued?', a: 'Yes. Bambu Lab ended the X1 series on March 31, 2026. Dealers may still sell stock, and Bambu supplies parts until March 31, 2031.' },
    { q: 'What is a good alternative to Bambu Lab?', a: 'Creality K1C (enclosed, single color), Elegoo Centauri Carbon (enclosed, 256 mm), Anycubic Kobra S1 Combo (enclosed, 4 colors) or Prusa Core One for an open-source ecosystem.' } ]
};
const DE3D = {
  slug: '3d-drucker-fuer-einsteiger-2026-bambu-lab-a1-p2s', term: '3d drucker', cat: 'Elektronik', vanaf: '2026-11-10', v: 1,
  title: 'Welcher 3D-Drucker passt zu dir als Einsteiger?', h1: '3D-Drucker für Einsteiger 2026: Bambu Lab A1, P2S oder eine Alternative?',
  seoTitle: '3D-Drucker für Einsteiger 2026: A1, P2S oder Alternative?', metaDesc: 'Offen oder geschlossen, eine Farbe oder vier, PLA oder ABS? Drei Fragen und du siehst, welcher 3D-Drucker zu dir passt, mit Preis bei Amazon.',
  intro: 'Moderne 3D-Drucker kalibrieren sich selbst und drucken kurz nach dem Auspacken. Der Unterschied liegt in der Druckgröße, im Material und darin, ob du mehrere Farben willst.',
  kort: 'Für PLA und PETG ist ein offener Drucker mit Selbstkalibrierung wie der Bambu Lab A1 (256 mm) der einfachste Einstieg, der A1 mini (180 mm) wenn Platz oder Budget knapp sind. Willst du ABS oder ASA drucken oder steht der Drucker im Wohnraum, nimm einen geschlossenen wie den Bambu Lab P2S, Creality K1C oder Elegoo Centauri Carbon. Die Combo mit Farbeinheit für 4 Spulen lohnt sich nur, wenn du wirklich mehrfarbig druckst.',
  questions: [
    { q: 'Was willst du vor allem drucken?', options: [
      { label: 'Spielzeug, Halter und Haushaltsteile aus PLA', kw: 'bambu lab a1', min: null, max: null },
      { label: 'Feste oder hitzebeständige Teile aus ABS oder ASA', kw: 'geschlossen gehäuse', min: null, max: null },
      { label: 'Große Teile über 30 cm', kw: 'großer bauraum', min: null, max: null } ] },
    { q: 'Wie viele Farben in einem Druck?', options: [
      { label: 'Eine Farbe reicht', kw: '', min: null, max: null },
      { label: 'Bis zu vier Farben', kw: 'combo mehrfarbig', min: null, max: null },
      { label: 'Weiß ich noch nicht', kw: '', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 400 Euro', kw: '', min: null, max: 400 },
      { label: '400 bis 800 Euro', kw: '', min: 400, max: 800 },
      { label: 'Über 800 Euro', kw: '', min: 800, max: null } ] } ],
  guide: 'Zuerst der Bauraum. Der A1 mini druckt bis 180 x 180 x 180 mm, genug für Schlüsselanhänger, Halter und kleine Teile. A1, P1S, P2S, Elegoo Centauri Carbon und Anycubic Kobra S1 schaffen rund 250 bis 256 mm pro Seite. Deutlich größer sind nur Bambu Lab H2D (350 x 320 x 325 mm) und Creality K2 Plus (350 mm).\nOffen oder geschlossen. A1 und A1 mini sind offen: ideal für PLA, PETG und TPU, laut Bambu nicht empfohlen für ABS, ASA oder Carbon-Filament. P1S und P2S sind geschlossen, Verzug und Dämpfe lassen sich besser kontrollieren. Der P2S (Test bei Tom\'s Hardware, Oktober 2025) bringt eine 1080p-Kamera mit KI-Fehlererkennung und die Farbeinheit AMS 2 Pro.\nMehrfarbig. Eine Combo hat eine Einheit für 4 Spulen (AMS lite bei der A1-Serie, AMS bei der P-Serie, CFS bei Creality, ACE Pro bei Anycubic). Mehrfarbdrucke dauern länger und erzeugen Abfall beim Farbwechsel.\nPreise am 10.11.2026 im Handel: Bambu Lab P2S 525 Euro, P2S Combo 662 Euro (Galaxus), P1S ab 499 Euro (Bambu-Shop), H2D 2.199 Euro (Bambu-Shop). Prüfe den Preis bei Amazon zum Kaufzeitpunkt, vor allem rund um den Black Friday am 27. November.\nSoftware. Seit Januar 2025 verlangt Bambu Lab eine eigene Freigabe für die Steuerung aus der Ferne, auch im LAN-Modus; Drucken von der SD-Karte geht weiter. Wer ein offenes System will, schaut auf Prusa (Core One, MK4S).',
  mistakes: ['ABS oder ASA auf einem offenen Drucker im Wohn- oder Schlafzimmer drucken.', 'Den A1 mini kaufen, obwohl die Teile größer als 18 cm werden.', 'Für eine Farbeinheit zahlen, die du kaum nutzt.', 'Noch nach dem X1 Carbon suchen: Bambu hat ihn am 31.03.2026 eingestellt.'],
  aiMiss: ['Viele Antworten nennen noch den P1S als neuesten geschlossenen Bambu; seit Ende 2025 gibt es den P2S.', 'Ältere Empfehlungen nennen den X1 Carbon als Premium-Wahl; die X1-Serie ist seit 31.03.2026 eingestellt (Ersatzteile bis 2031).', 'Die Firmware-Änderung von 2025 fehlt oft: Fernsteuerung braucht jetzt eine Bambu-Freigabe, auch im LAN-Modus.'],
  faq: [
    { q: 'Welcher 3D-Drucker ist der beste für Einsteiger?', a: 'Ein Drucker, der sich selbst kalibriert, wie der Bambu Lab A1 oder A1 mini. Für ABS und ASA einen geschlossenen wie den Bambu Lab P2S.' },
    { q: 'Was ist der Unterschied zwischen Bambu Lab P1S und P2S?', a: 'Beide sind geschlossen mit 256 mm Bauraum. Der P2S ist der Nachfolger von 2025 mit 1080p-KI-Kamera, bis 600 mm/s und AMS 2 Pro.' },
    { q: 'Kann der Bambu Lab A1 ABS drucken?', a: 'Bambu Lab empfiehlt ABS, ASA, PC und Carbon-Filament auf A1 und A1 mini nicht. Dafür ist ein geschlossener Drucker besser.' },
    { q: 'Ist der Bambu Lab X1 Carbon noch erhältlich?', a: 'Bambu hat die X1-Serie am 31.03.2026 eingestellt. Händler haben teils noch Restbestand, Ersatzteile gibt es bis 31.03.2031.' },
    { q: 'Was kostet Filament?', a: 'Bambu PLA Basic kostet je nach Farbe etwa 22 bis 45 Euro pro Kilo (Galaxus, 10.11.2026).' } ]
};


// Robotstofzuigers met station (10 nov 2026, feiten: fabrikant, Stiftung Warentest, homeandsmart.de, Netzwelt, TechRadar, Notebookcheck)
const USROBOT = {
  slug: 'roborock-vs-dreame-vs-ecovacs-robot-vacuum-2026', term: 'robot vacuum mop self emptying', cat: 'Home', vanaf: '2026-11-10', v: 1,
  title: 'Roborock, Dreame or Ecovacs: which robot vacuum with a dock should you buy?', h1: 'Roborock vs Dreame vs Ecovacs (2026): which robot vacuum and mop with a dock fits your home',
  seoTitle: 'Roborock vs Dreame vs Ecovacs: which to buy (2026)', metaDesc: 'Saros 20, Qrevo Edge 2, Dreame X60 Pro Ultra or Ecovacs X12? Answer 3 questions on floors, furniture height and budget and see which robot vacuum fits.',
  intro: 'Roborock, Dreame and Ecovacs sell most of the high-end robot vacuums with a self-emptying, mop-washing dock. The right one depends on your floors, how low your furniture is and how many thresholds the robot must climb.',
  kort: 'For most homes a mid-range dock model is enough, such as the Roborock Qrevo Edge 2 Pro or the Ecovacs Deebot X12 OmniCyclone. If your sofa is lower than about 9 cm, pick a flat Roborock Saros (7.98 cm tall, no lidar turret). If you have high thresholds, the Dreame X60 Pro Ultra climbs up to 10 cm in two steps according to Dreame. Do not buy on Pa numbers alone: Stiftung Warentest calls high suction figures mostly marketing.',
  questions: [
    { q: 'What floors do you have most?', options: [
      { label: 'Mostly hard floors', kw: 'mop', min: null, max: null },
      { label: 'Carpet and pet hair', kw: 'pet hair carpet', min: null, max: null },
      { label: 'A mix of both', kw: '', min: null, max: null } ] },
    { q: 'Which brand do you prefer?', options: [
      { label: 'Roborock', kw: 'roborock', min: null, max: null },
      { label: 'Dreame', kw: 'dreame', min: null, max: null },
      { label: 'Ecovacs', kw: 'ecovacs deebot', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $600', kw: '', min: null, max: 600 },
      { label: '$600 to $1,000', kw: '', min: 600, max: 1000 },
      { label: 'Over $1,000', kw: '', min: 1000, max: null } ] } ],
  guide: 'Height first. Measure under your sofa and beds. The Roborock Saros 10R and Saros 20 are 7.98 cm tall without a lidar turret; the Dreame X60 Pro Ultra is 8.9 cm (11.1 cm with its sensor raised); the Ecovacs Deebot X12 OmniCyclone is 9.8 cm.\nThresholds. Roborock specifies 4.5 cm single and 8.8 cm double thresholds for the Saros 20. Dreame specifies 5.2 cm single and 10 cm in two steps for the X60 Pro Ultra. Ecovacs lists 2.4 cm single and 4 cm double for the X12; homeandsmart.de saw it stop at 2.5 cm in testing.\nMopping. Roborock and Dreame use two spinning pads that the arm can push out to edges. Ecovacs uses a 27 cm roller that is rinsed while it mops. All three docks wash the mops with hot water (Roborock Saros 20 and Dreame X60 up to 100 °C) and dry them with warm air.\nNavigation and obstacles. All use lidar or 3D structured light plus an AI camera. The Consumentenbond calls navigation the biggest factor in cleaning quality, and Stiftung Warentest (June 2026) says floor type and pet hair matter more than the Pa figure.\nTests. homeandsmart.de gave the Saros 10R 95/100 and the X12 OmniCyclone 92/100; Netzwelt rated the Dreame X60 Pro Ultra Complete 1.5 (very good); TechRadar gave the Saros 20 4.5/5 for performance.',
  mistakes: ['Choosing the robot with the highest Pa number.', 'Not measuring under the sofa: a 9.8 cm robot will not fit under 9 cm.', 'Forgetting the dock needs about 40 x 45 x 50 cm of floor space plus an outlet.', 'Buying a dock with no water hookup option when you dislike refilling tanks.'],
  aiMiss: ['Older answers often still name 2024 flagships; the 2026 flagships are the Saros 20, Dreame X60 Pro Ultra and Ecovacs X12.', 'Generic advice ranks robots by suction (Pa); testers now say navigation, brushes and mops matter more.', 'Few answers mention robot height, while flat models without a lidar turret (Saros series) now exist.'],
  faq: [
    { q: 'Is Roborock or Dreame better?', a: 'Both are strong. Roborock has the flattest robots (Saros series, 7.98 cm), Dreame the best climbing on the X60 Pro Ultra (up to 10 cm in two steps). Choose on your furniture and thresholds.' },
    { q: 'Which robot vacuum is best for pet hair?', a: 'Look for a tangle-free brush (Roborock DuoDivide, Dreame DuoBrush, Ecovacs ZeroTangle) and strong carpet results in tests, not only a high Pa number.' },
    { q: 'How tall is the Roborock Saros 20?', a: '7.98 cm, according to Roborock, so it fits under most low sofas.' },
    { q: 'Is the Ecovacs Deebot X12 OmniCyclone good?', a: 'homeandsmart.de rated it 92/100 (very good) in April 2026. It uses a 27 cm roller mop that rinses while it cleans and a bagless dock.' },
    { q: 'When is Black Friday 2026?', a: 'Friday, November 27, 2026. Cyber Monday is November 30.' } ]
};
const DEROBOT = {
  slug: 'saugroboter-mit-absaugstation-roborock-dreame-ecovacs-2026', term: 'saugroboter mit absaugstation wischfunktion', cat: 'Haushalt', vanaf: '2026-11-10', v: 1,
  title: 'Roborock, Dreame oder Ecovacs: welcher Saugroboter mit Station passt zu dir?', h1: 'Saugroboter mit Absaugstation 2026: Roborock, Dreame oder Ecovacs?',
  seoTitle: 'Saugroboter mit Station 2026: Roborock, Dreame, Ecovacs', metaDesc: 'Saros 20, Qrevo Edge 2, Dreame X60 Pro Ultra oder Ecovacs X12? Drei Fragen zu Boden, Möbelhöhe und Budget, mit Preis bei Amazon.',
  intro: 'Roborock, Dreame und Ecovacs verkaufen die meisten Saugroboter mit Station, die sich selbst leert, die Mopps wäscht und trocknet. Welcher passt, hängt von deinen Böden, der Höhe deiner Möbel und den Schwellen ab.',
  kort: 'Für die meisten Wohnungen reicht ein Modell um 550 bis 1.000 Euro, etwa Roborock Saros 10R (am 11.11.2026 549 Euro bei Amazon), Ecovacs Deebot X12 OmniCyclone (699 Euro) oder Dreame Matrix10 Pro (999 Euro). Niedriges Sofa unter 9 cm? Nimm einen flachen Roborock Saros (7,98 cm). Viele Schwellen? Der Dreame X60 Pro Ultra schafft laut Dreame bis 10 cm in zwei Stufen. Kauf nicht nach Pa: Stiftung Warentest nennt hohe Pa-Werte vor allem Marketing.',
  questions: [
    { q: 'Welche Böden hast du vor allem?', options: [
      { label: 'Vor allem Hartboden', kw: 'wischfunktion', min: null, max: null },
      { label: 'Teppich und Tierhaare', kw: 'tierhaare teppich', min: null, max: null },
      { label: 'Gemischt', kw: '', min: null, max: null } ] },
    { q: 'Welche Marke bevorzugst du?', options: [
      { label: 'Roborock', kw: 'roborock', min: null, max: null },
      { label: 'Dreame', kw: 'dreame', min: null, max: null },
      { label: 'Ecovacs', kw: 'ecovacs deebot', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 600 Euro', kw: '', min: null, max: 600 },
      { label: '600 bis 1.000 Euro', kw: '', min: 600, max: 1000 },
      { label: 'Über 1.000 Euro', kw: '', min: 1000, max: null } ] } ],
  guide: 'Zuerst die Höhe. Miss unter Sofa und Betten. Roborock Saros 10R und Saros 20 sind 7,98 cm hoch und haben keinen Lidar-Turm; der Dreame X60 Pro Ultra misst 8,9 cm (mit ausgefahrenem Sensor 11,1 cm), der Ecovacs Deebot X12 OmniCyclone 9,8 cm.\nSchwellen. Roborock nennt für den Saros 20 4,5 cm einfach und 8,8 cm doppelt, Dreame für den X60 Pro Ultra 5,2 cm einfach und 10 cm in zwei Stufen, Ecovacs für den X12 2,4 cm einfach und 4 cm doppelt; homeandsmart.de sah ihn im Test bei 2,5 cm stoppen.\nWischen. Roborock und Dreame wischen mit zwei rotierenden Mopps, die zum Rand ausfahren. Ecovacs nutzt beim X12 eine 27-cm-Walze, die beim Wischen gespült wird. Saros 20 und X60 Pro Ultra waschen die Mopps mit bis zu 100 °C heißem Wasser.\nTests. Stiftung Warentest (Juni 2026) nennt Bodenart und Tierhaare wichtiger als Pa; der Dreame X50 Ultra bekam dort im Januar 2026 "befriedigend". homeandsmart.de gab dem Saros 10R 95/100 und dem X12 OmniCyclone 92/100, Netzwelt dem Dreame X60 Pro Ultra Complete die Note 1,5.\nPreise. UVP Roborock Saros 20 1.499 Euro, Saros 10R 1.449,99 Euro, Dreame X60 Pro Ultra Complete ab 1.499 Euro, Dreame Matrix10 Ultra 1.599 Euro, Ecovacs X12 1.399 Euro. Die Amazon-Preise lagen am 11.11.2026 oft weit darunter; vergleiche vor dem Black Friday am 27. November.',
  mistakes: ['Den Roboter mit dem höchsten Pa-Wert kaufen.', 'Nicht unter dem Sofa messen: ein Roboter mit 9,8 cm passt nicht unter 9 cm.', 'Keinen Platz für die Station einplanen (etwa 40 x 45 x 50 cm plus Steckdose).', 'Den UVP für den Preis halten: bei Amazon liegen viele Modelle deutlich darunter.'],
  aiMiss: ['Ältere Antworten nennen oft noch Spitzenmodelle von 2024; aktuell sind Saros 20, X60 Pro Ultra und X12 die Spitzenmodelle.', 'Allgemeine Ratschläge sortieren nach Pa; Stiftung Warentest sagt, dass Navigation, Bürste und Mopp mehr zählen.', 'Die Gerätehöhe fehlt fast immer, obwohl es flache Modelle ohne Lidar-Turm gibt (Saros-Serie).'],
  faq: [
    { q: 'Was ist besser, Roborock oder Dreame?', a: 'Beide sind stark. Roborock hat die flachsten Geräte (Saros, 7,98 cm), Dreame mit dem X60 Pro Ultra die größte Kletterhöhe (bis 10 cm in zwei Stufen). Entscheide nach Möbeln und Schwellen.' },
    { q: 'Welcher Saugroboter ist der beste für Tierhaare?', a: 'Einer mit Anti-Verheddern-Bürste (Roborock DuoDivide, Dreame DuoBrush, Ecovacs ZeroTangle) und gutem Teppichergebnis im Test, nicht nur mit hohem Pa-Wert.' },
    { q: 'Wie hoch ist der Roborock Saros 10R?', a: '7,98 cm laut Roborock, ohne Lidar-Turm. Er passt unter die meisten niedrigen Sofas.' },
    { q: 'Was hat Stiftung Warentest zu Saugrobotern gesagt?', a: 'Im Test von Juni 2026: Bodenart und Tierhaare entscheiden, ein hoher Pa-Wert ist vor allem Marketing. Der Dreame X50 Ultra bekam im Januar 2026 "befriedigend".' },
    { q: 'Wann ist Black Friday 2026?', a: 'Am Freitag, 27. November 2026. Cyber Monday ist der 30. November.' } ]
};
// Balkonkraftwerk-Speicher (10 nov 2026, feiten: fabrikant, homeandsmart.de, Stiftung Warentest, ess-news, Notebookcheck)
const DESPEICHER = {
  slug: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', term: 'balkonkraftwerk speicher', cat: 'Energie', vanaf: '2026-11-10', v: 1,
  title: 'Welcher Speicher fürs Balkonkraftwerk passt zu dir?', h1: 'Balkonkraftwerk-Speicher 2026: Anker SOLIX, Zendure, EcoFlow, Marstek und Co. im Vergleich',
  seoTitle: 'Balkonkraftwerk Speicher 2026: Anker, Zendure, EcoFlow', metaDesc: 'Anker Solarbank 3, Zendure SolarFlow, EcoFlow STREAM, Marstek Venus E, Growatt NOAH, Bluetti Balco, Solakon ONE: drei Fragen und der passende Speicher.',
  intro: 'Ein Speicher hebt den Solarstrom deines Balkonkraftwerks für den Abend auf. Die Geräte unterscheiden sich vor allem darin, ob sie direkt an die Module kommen (DC) oder an die Steckdose (AC), wie viel sie speichern und ob du sie später erweitern kannst.',
  kort: 'Hast du schon ein Balkonkraftwerk mit Wechselrichter, ist ein AC-Speicher an der Steckdose am einfachsten, etwa EcoFlow STREAM AC Pro (1,92 kWh), Marstek Venus E 3.0 (5,12 kWh) oder Jackery SolarVault 3 Pro Max AC (2,52 kWh). Planst du neu, sind Speicher mit eigenem Solareingang wie Anker Solarbank 3 E2700 Pro, Zendure SolarFlow 800 Pro 2, Growatt NOAH 2000 oder Solakon ONE oft günstiger. Ins Netz dürfen in Deutschland höchstens 800 W.',
  questions: [
    { q: 'Hast du schon ein Balkonkraftwerk?', options: [
      { label: 'Ja, mit Wechselrichter', kw: 'ac gekoppelt steckdose', min: null, max: null },
      { label: 'Nein, ich plane neu', kw: 'mppt solareingang', min: null, max: null },
      { label: 'Weiß ich nicht', kw: '', min: null, max: null } ] },
    { q: 'Wie viel Strom willst du speichern?', options: [
      { label: 'Etwa 2 kWh für den Abend', kw: '2 kwh', min: null, max: null },
      { label: 'Etwa 5 kWh oder erweiterbar', kw: '5 kwh erweiterbar', min: null, max: null },
      { label: 'Weiß ich noch nicht', kw: '', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 700 Euro', kw: '', min: null, max: 700 },
      { label: '700 bis 1.200 Euro', kw: '', min: 700, max: 1200 },
      { label: 'Über 1.200 Euro', kw: '', min: 1200, max: null } ] } ],
  guide: 'Die Regeln. Ein Balkonkraftwerk darf in Deutschland mit höchstens 800 W einspeisen; mit Schuko-Stecker sind bis 960 Wp Module erlaubt, mehr nur mit spezieller Energiesteckdose. Jede Anlage muss ins Marktstammdatenregister. Ein Speicher ändert die 800-W-Grenze nicht.\nAC oder DC. AC-Speicher hängen an der Steckdose und arbeiten mit jedem vorhandenen Balkonkraftwerk: EcoFlow STREAM AC Pro (1,92 kWh, bis 11,5 kWh), Marstek Venus E 3.0 (5,12 kWh, im Shop 899 Euro, zeitweise ausverkauft), Jackery SolarVault 3 Pro Max AC (2,52 kWh, bis 15,12 kWh, UVP 1.199 Euro). Speicher mit Solareingang ersetzen einen Teil des Systems: Anker Solarbank 3 E2700 Pro (2,688 kWh, bis 16 kWh, 3.600 W Solareingang, rund 1.055 Euro), Zendure SolarFlow 800 Pro (1,92 kWh, 449 Euro, abgelöst durch die Pro 2 für 499 Euro), Growatt NOAH 2000 (2,048 kWh, bis 8,192 kWh, DC zum Mikrowechselrichter) und Solakon ONE (2,11 kWh, bis 12,66 kWh, 529,99 Euro, Lieferung nur DE und AT).\nNeu 2026. Bluetti Balco 260 (2,56 kWh, bis 15 kWh, UVP 1.399 Euro, bei Amazon.de) und Balco 500 (5 kWh, bis 30 kWh). Fast alle Geräte haben 10 Jahre Garantie und IP65.\nTests. Stiftung Warentest prüfte im März 2026 fünf Speicher (Anker E2700 Pro, EcoFlow STREAM Ultra, FoxESS, Growatt Nexa 2000, Zendure 800 Pro): Urteile von befriedigend bis mangelhaft, drei wegen elektromagnetischer Störungen, bei vier drang Regenwasser in die eingebaute Steckdose. Welches Gerät welches Urteil bekam, steht hinter der Bezahlschranke von test.de.\nAlle Preise mit Datum aus den Quellen (Oktober und November 2026); vergleiche den aktuellen Preis bei Amazon.',
  mistakes: ['Glauben, ein Speicher erlaube mehr als 800 W Einspeisung.', 'Einen DC-Speicher kaufen, obwohl du schon einen Wechselrichter hast und einfach an die Steckdose willst.', 'Nur auf kWh schauen und die Leistung in Watt vergessen: 800 W ins Haus reichen für die Grundlast, nicht für den Wasserkocher.', 'Den Speicher im Freien ohne Schutz aufstellen: Stiftung Warentest fand Regenwasser in Steckdosen.'],
  aiMiss: ['Viele Antworten nennen noch Zendure Hyper 2000 und Anker Solarbank 2; die Hyper 2000 ist ausverkauft, aktuell sind SolarFlow 800 Pro 2 und Solarbank 3.', 'Neue Marken von 2026 fehlen oft: Bluetti Balco, Jackery SolarVault 3, Solakon ONE.', 'Der Test von Stiftung Warentest (März 2026) mit drei mangelhaften Geräten wird selten erwähnt.'],
  faq: [
    { q: 'Welcher Balkonkraftwerk-Speicher ist der beste?', a: 'Es gibt keinen für alle. Mit vorhandenem Wechselrichter ist ein AC-Speicher wie EcoFlow STREAM AC Pro oder Marstek Venus E 3.0 am einfachsten, bei einer neuen Anlage ein Speicher mit Solareingang wie Anker Solarbank 3 oder Zendure SolarFlow 800 Pro 2.' },
    { q: 'Wie viel Speicher braucht ein Balkonkraftwerk?', a: 'Für eine typische 800-W-Anlage reichen meist 1,5 bis 2,5 kWh, um den Abend und die Nacht mit Grundlast zu überbrücken. Größere Speicher lohnen sich nur, wenn tagsüber wirklich so viel übrig bleibt.' },
    { q: 'Darf ein Speicher mehr als 800 W einspeisen?', a: 'Nein, die Grenze für Balkonkraftwerke liegt bei 800 W ins Netz, auch mit Speicher. Manche Geräte können mehr, dürfen das aber nur nach Installation durch eine Fachkraft und Anmeldung.' },
    { q: 'Muss ich den Speicher anmelden?', a: 'Das Balkonkraftwerk muss ins Marktstammdatenregister. Ob ein Speicher separat eingetragen werden muss, prüfe beim Register oder deinem Netzbetreiber.' },
    { q: 'Was sagt Stiftung Warentest zu Balkonkraftwerk-Speichern?', a: 'Im Test vom März 2026 gab es Urteile von befriedigend bis mangelhaft; drei Geräte fielen wegen elektromagnetischer Störungen durch, bei vier drang Regenwasser in die Steckdose.' } ]
};

export const WTB_HAND = { us: [US3D, USROBOT], de: [DE3D, DEROBOT, DESPEICHER] };
