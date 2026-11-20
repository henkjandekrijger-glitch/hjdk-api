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
  // v2 (18 nov 2026, Demand Radar): "balkonkraftwerk mit speicher" 110.000 pro Monat (feste Nachfrage) gegen "balkonkraftwerk speicher" 8.100: die große Suchanfrage steht vorn.
  slug: 'balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', term: 'balkonkraftwerk mit speicher', cat: 'Energie', vanaf: '2026-11-10', v: 2,
  title: 'Welches Balkonkraftwerk mit Speicher passt zu dir?', h1: 'Balkonkraftwerk mit Speicher 2026: Anker SOLIX, Zendure, EcoFlow, Marstek und Co. im Vergleich',
  seoTitle: 'Balkonkraftwerk mit Speicher 2026: 9 Speicher im Vergleich', metaDesc: 'Balkonkraftwerk mit Speicher: Anker Solarbank 3, Zendure, EcoFlow STREAM, Marstek Venus E 3.0, Growatt, Bluetti, Solakon. 3 Fragen, Testergebnis, Preise.',
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
    { q: 'Welches Balkonkraftwerk mit Speicher ist Testsieger?', a: 'Einen öffentlichen Testsieger gibt es nicht. Stiftung Warentest prüfte im März 2026 fünf Speicher (Anker E2700 Pro, EcoFlow STREAM Ultra, FoxESS, Growatt Nexa 2000, Zendure 800 Pro) mit Urteilen von befriedigend bis mangelhaft; welches Gerät welches Urteil bekam, steht hinter der Bezahlschranke. Laut appgefahren war die Anker Solarbank 3 E2700 Pro mit 3,3 das einzige befriedigende Gerät. Seiten, die einen anderen Testsieger nennen, meinen meist eigene Vergleiche.' },
    { q: 'Was bedeutet 2000 W bei einem Balkonkraftwerk mit Speicher?', a: 'Meist die Solarleistung, die der Speicher aufnehmen kann (Module bis etwa 2.000 Wp), oder die Leistung seiner eigenen Steckdose. Ins Hausnetz dürfen auch mit Speicher höchstens 800 W. Anker Solarbank 3 E2700 Pro nimmt zum Beispiel bis 3.600 W Solarleistung auf.' },
    { q: 'Kann ich einen Speicher am Balkonkraftwerk nachrüsten?', a: 'Ja. Hast du schon ein Balkonkraftwerk mit Wechselrichter, nimm einen AC-Speicher für die Steckdose wie EcoFlow STREAM AC Pro (1,92 kWh), Marstek Venus E 3.0 (5,12 kWh) oder Jackery SolarVault 3 Pro Max AC (2,52 kWh). Ein DC-Speicher wie Growatt NOAH 2000 kommt zwischen Module und Mikrowechselrichter.' },
    { q: 'Welcher Balkonkraftwerk-Speicher ist der beste?', a: 'Es gibt keinen für alle. Mit vorhandenem Wechselrichter ist ein AC-Speicher wie EcoFlow STREAM AC Pro oder Marstek Venus E 3.0 am einfachsten, bei einer neuen Anlage ein Speicher mit Solareingang wie Anker Solarbank 3 oder Zendure SolarFlow 800 Pro 2.' },
    { q: 'Wie viel Speicher braucht ein Balkonkraftwerk?', a: 'Für eine typische 800-W-Anlage reichen meist 1,5 bis 2,5 kWh, um den Abend und die Nacht mit Grundlast zu überbrücken. Größere Speicher lohnen sich nur, wenn tagsüber wirklich so viel übrig bleibt.' },
    { q: 'Darf ein Speicher mehr als 800 W einspeisen?', a: 'Nein, die Grenze für Balkonkraftwerke liegt bei 800 W ins Netz, auch mit Speicher. Manche Geräte können mehr, dürfen das aber nur nach Installation durch eine Fachkraft und Anmeldung.' },
    { q: 'Muss ich den Speicher anmelden?', a: 'Das Balkonkraftwerk muss ins Marktstammdatenregister. Ob ein Speicher separat eingetragen werden muss, prüfe beim Register oder deinem Netzbetreiber.' },
    { q: 'Was sagt Stiftung Warentest zu Balkonkraftwerk-Speichern?', a: 'Im Test vom März 2026 gab es Urteile von befriedigend bis mangelhaft; drei Geräte fielen wegen elektromagnetischer Störungen durch, bei vier drang Regenwasser in die Steckdose.' } ]
};

// 14 nov 2026: wat in ChatGPT werkt op keuzehulp.best (kerstcadeau onder 10 euro, cadeau juf of meester) ook in de VS en Duitsland, met de hand geschreven
const USELEPHANT = {
  slug: 'white-elephant-gifts-under-25-2026', term: 'white elephant gift', cat: 'Gifts', vanaf: '2026-11-14', v: 1,
  title: 'Which white elephant gift under $25 will people actually fight over?', h1: 'White elephant gifts under $25 (2026): pick one people steal, not one they re-gift',
  seoTitle: 'White elephant gifts under $25 people actually want (2026)', metaDesc: 'Funny, cozy or useful? Answer 3 questions about the group and the budget and get a white elephant gift under $25 that gets stolen, with today\'s Amazon price.',
  intro: 'In a white elephant swap the good gifts get stolen and the bad ones go home with someone who did not want them. The trick is a gift almost anyone in the room would use, with a bit of fun. Three questions.',
  kort: 'Pick something almost anyone in the room would use: a soft throw blanket, an insulated tumbler, a card or party game the group can play that night, or a small gadget such as a rechargeable hand warmer. Stay at the agreed limit (common limits are $20 or $25) and wrap it so nobody can guess the shape.',
  questions: [
    { q: 'What kind of gift do you want to bring?', options: [
      { label: 'Cozy', kw: 'sherpa throw blanket', min: null, max: null },
      { label: 'Useful gadget', kw: 'rechargeable hand warmer', min: null, max: null },
      { label: 'A game for the group', kw: 'party card game adults', min: null, max: null },
      { label: 'Coffee or drinks', kw: 'insulated tumbler with lid', min: null, max: null } ] },
    { q: 'Who is in the swap?', options: [
      { label: 'Coworkers', kw: '', min: null, max: null },
      { label: 'Family, all ages', kw: '', min: null, max: null },
      { label: 'Friends', kw: '', min: null, max: null } ] },
    { q: 'What is the price limit?', options: [
      { label: 'Under $20', kw: '', min: null, max: 20 },
      { label: '$20 to $25', kw: '', min: 18, max: 25 },
      { label: 'Up to $35', kw: '', min: 25, max: 35 } ] } ],
  guide: 'Agree on the limit first. Common limits are $20 or $25. Going far over makes others feel cheap; going far under makes yours the gift nobody steals.\nUseful beats funny. A gag gift gets one laugh and then sits in a drawer. A throw, a tumbler or a hand warmer gets used, and tends to get stolen. If you want funny, make it funny and usable, like a game the group plays that night.\nThink about the room. At work keep it safe for everyone: no alcohol unless you know the group, nothing personal like perfume or clothing in a size. With family of all ages a game works well because everyone can join in.\nWrap it to hide the shape. Half the fun is guessing. A box inside a box hides a tumbler or a game.\nCheck the delivery date. Christmas 2026 is on Friday, December 25. Most office parties are earlier in December, so order early and check the delivery date on the product page.',
  mistakes: ['Ignoring the price limit the group agreed on.', 'Bringing a gag gift nobody uses after the party.', 'Choosing clothing or perfume for a mixed group.', 'Ordering too late for the party date.'],
  aiMiss: ['Many "under $25" lists mix in gifts that cost far more.', 'Generic lists ignore who is in the room; an office swap needs safer gifts than a swap with friends.'],
  faq: [
    { q: 'What is a good white elephant gift under $25?', a: 'Something almost anyone would use, with a little fun: a soft throw, an insulated tumbler, a card or party game, or a rechargeable hand warmer.' },
    { q: 'What is the usual price limit for a white elephant exchange?', a: 'Common limits are $20 or $25, some groups go higher. Whatever the group picks, everyone should stick to it.' },
    { q: 'Is white elephant the same as Secret Santa?', a: 'No. In Secret Santa you buy for the one person you drew. In white elephant everyone brings one gift for the pile and people can steal gifts from each other.' },
    { q: 'What is a good white elephant gift for coworkers?', a: 'Keep it neutral: a tumbler, a desk gadget, a game or a cozy throw. Skip alcohol, perfume and clothing sizes.' },
    { q: 'When is Christmas 2026?', a: 'Friday, December 25, 2026.' } ]
};
const USTEACHER = {
  slug: 'christmas-gifts-for-teachers-under-25-2026', term: 'teacher gifts', cat: 'Gifts', vanaf: '2026-11-14', v: 1,
  title: 'Which Christmas gift under $25 will a teacher actually use?', h1: 'Christmas gifts for teachers under $25 (2026): what they use, and what the rules allow',
  seoTitle: 'Christmas gifts for teachers under $25 they actually use (2026)', metaDesc: 'Skip the fifth mug. Answer 3 questions and pick a teacher gift under $25 they will use, plus the gift limits some states set, with today\'s Amazon price.',
  intro: 'Teachers get a lot of mugs and candles. A better gift is something they use in the classroom or to recharge after it. Some states and school districts also limit what teachers may accept. Three questions.',
  kort: 'Classroom supplies teachers often buy themselves (good pens, sticky notes, dry-erase markers), an insulated tumbler that keeps coffee hot through first period, or something to unwind with are safe picks. A handwritten note from the child adds more than extra dollars. Check the local rules: in Massachusetts, for example, gifts to a teacher are limited to $50 a year, and a gift from the whole class counts toward that limit.',
  questions: [
    { q: 'What would the teacher use?', options: [
      { label: 'Something for the classroom', kw: 'teacher pens set', min: null, max: null },
      { label: 'Coffee or tea during the day', kw: 'insulated tumbler with lid', min: null, max: null },
      { label: 'Something to unwind with', kw: 'hand cream gift set', min: null, max: null },
      { label: 'Reading', kw: 'rechargeable book light', min: null, max: null } ] },
    { q: 'Which teacher is it for?', options: [
      { label: 'Elementary school', kw: '', min: null, max: null },
      { label: 'Middle or high school', kw: '', min: null, max: null },
      { label: 'Daycare or preschool', kw: '', min: null, max: null } ] },
    { q: 'What do you want to spend?', options: [
      { label: 'Under $15', kw: '', min: null, max: 15 },
      { label: '$15 to $25', kw: '', min: 12, max: 25 } ] } ],
  guide: 'Think classroom. Many teachers pay for supplies out of their own pocket. Good pens, sticky notes, dry-erase markers or a label maker get used every day.\nSkip the fifth mug. Mugs, candles and lotions are the gifts teachers tend to get plenty of. If you give a drink gift, pick an insulated tumbler with a lid that fits a car cup holder.\nCheck the rules. Public school teachers are public employees and some states and districts limit gifts. In Massachusetts gifts to a teacher are limited to $50 a year, and gifts from a group with a common interest, such as one class, count toward that limit. Your school office can tell you the local rule, also for gift cards.\nPool with the class, within the limit. One good gift from the class often beats twenty small ones, as long as the total stays inside the local rule.\nAdd a note. A short note or drawing from the child is often the part a teacher keeps. Give the gift on the last school day before winter break.',
  mistakes: ['Giving another mug or candle.', 'Pooling a class gift above the local limit.', 'Giving cash where the district treats it as not allowed.', 'Forgetting the note from the child.'],
  aiMiss: ['Most gift lists never mention that some states limit gifts to teachers.', 'Few lists point out that a class gift can count as one gift toward that limit.'],
  faq: [
    { q: 'What is a good Christmas gift for a teacher under $25?', a: 'Something they use: classroom supplies, an insulated tumbler, a book light or something to unwind with, plus a note from the child.' },
    { q: 'Is there a limit on gifts to teachers?', a: 'It depends on the state and district. In Massachusetts the limit is $50 per teacher per year, including gifts from a group such as one class. Ask your school.' },
    { q: 'Should the class pool money for one gift?', a: 'It often makes a better gift, but check the local rule: in some states a group gift counts as one gift toward the limit.' },
    { q: 'When should you give a teacher a Christmas gift?', a: 'On the last school day before winter break, with a short note from the child.' } ]
};
const DEWICHTEL = {
  slug: 'wichtelgeschenke-unter-10-euro-2026', term: 'wichtelgeschenk', cat: 'Geschenke', vanaf: '2026-11-14', v: 1,
  title: 'Welches Wichtelgeschenk unter 10 Euro kommt wirklich gut an?', h1: 'Wichtelgeschenke unter 10 Euro (2026): klein, nützlich und nicht peinlich',
  seoTitle: 'Wichtelgeschenke unter 10 Euro, die gut ankommen (2026)', metaDesc: 'Fürs Büro, die Familie oder Freunde? Drei Fragen und ein Wichtelgeschenk unter 10 Euro, das man wirklich benutzt, mit dem Preis von heute bei Amazon.',
  intro: 'Beim Wichteln ist das Budget klein, und oft kennt man die Person kaum. Ein gutes Geschenk unter 10 Euro ist nützlich, ein bisschen persönlich und passt zu fast jedem. Drei Fragen.',
  kort: 'Nimm etwas, das fast jeder benutzt: warme Kuschelsocken, ein Kartenspiel für den Abend, einen Taschenwärmer oder etwas Leckeres wie guten Tee. Bleib beim vereinbarten Betrag, oft 5 oder 10 Euro, und pack es schön ein: bei kleinem Budget macht die Verpackung viel aus.',
  questions: [
    { q: 'Was mag die Person?', options: [
      { label: 'Gemütlich zu Hause', kw: 'kuschelsocken', min: null, max: null },
      { label: 'Spiele und Spaß', kw: 'kartenspiel erwachsene', min: null, max: null },
      { label: 'Draußen und unterwegs', kw: 'taschenwärmer', min: null, max: null },
      { label: 'Genuss', kw: 'tee geschenkset', min: null, max: null } ] },
    { q: 'Wo wird gewichtelt?', options: [
      { label: 'Im Büro', kw: '', min: null, max: null },
      { label: 'In der Familie', kw: '', min: null, max: null },
      { label: 'Unter Freunden', kw: '', min: null, max: null } ] },
    { q: 'Wie hoch ist das Budget?', options: [
      { label: 'Bis 5 Euro', kw: '', min: null, max: 5 },
      { label: '5 bis 10 Euro', kw: '', min: 5, max: 10 },
      { label: 'Bis 15 Euro', kw: '', min: 10, max: 15 } ] } ],
  guide: 'Erst das Budget. Beim Wichteln legt die Gruppe einen Betrag fest, oft 5, 10 oder 15 Euro. Wer weit darüber liegt, bringt die anderen in Verlegenheit.\nNützlich schlägt lustig. Ein Scherzartikel bringt einen Lacher und landet dann im Schrank. Socken, ein Kartenspiel oder ein Taschenwärmer werden benutzt.\nIm Büro vorsichtig. Kein Alkohol, wenn du die Gruppe nicht kennst, nichts in Kleidergrößen und kein Parfüm.\nSchön verpacken. Papier, Schleife und eine kleine Karte kosten wenig und machen aus einem 8-Euro-Geschenk etwas Besonderes.\nRechtzeitig bestellen. Weihnachten ist am Freitag, 25. Dezember 2026. Wichtelfeiern sind oft früher im Dezember, schau also beim Produkt auf das Lieferdatum.',
  mistakes: ['Weit über dem vereinbarten Betrag liegen.', 'Einen Scherzartikel kaufen, den niemand benutzt.', 'Kleidung in einer Größe oder Parfüm für jemanden, den du kaum kennst.', 'Zu spät bestellen für die Feier.'],
  aiMiss: ['Viele Listen unter 10 Euro enthalten Geschenke, die deutlich mehr kosten.', 'Allgemeine Listen unterscheiden nicht zwischen Büro, Familie und Freunden.'],
  faq: [
    { q: 'Was schenkt man beim Wichteln für 10 Euro?', a: 'Etwas, das fast jeder benutzt: Kuschelsocken, ein Kartenspiel, einen Taschenwärmer oder guten Tee, schön verpackt.' },
    { q: 'Was ist ein gutes Wichtelgeschenk fürs Büro?', a: 'Etwas Neutrales: ein Thermobecher, ein Kartenspiel, Tee oder Socken. Kein Alkohol, kein Parfüm, keine Kleidergrößen.' },
    { q: 'Was ist der Unterschied zwischen Wichteln und Schrottwichteln?', a: 'Beim Wichteln kaufst du ein Geschenk für die Person, die du gezogen hast. Beim Schrottwichteln bringt jeder etwas Ungewöhnliches mit, und die Geschenke werden oft getauscht oder geklaut.' },
    { q: 'Wann ist Weihnachten 2026?', a: 'Am Freitag, 25. Dezember 2026.' } ]
};
const DELEHRER = {
  slug: 'geschenk-fuer-lehrer-weihnachten-erlaubt-2026', term: 'geschenk lehrerin', cat: 'Geschenke', vanaf: '2026-11-14', v: 1,
  title: 'Welches Weihnachtsgeschenk für Lehrerin oder Lehrer ist erlaubt und kommt an?', h1: 'Geschenk für Lehrer zu Weihnachten (2026): was erlaubt ist und was ankommt',
  seoTitle: 'Weihnachtsgeschenk für Lehrer: was erlaubt ist (2026)', metaDesc: 'Wie viel darf ein Geschenk für Lehrerinnen und Lehrer kosten? Die Grenzen je Bundesland, drei Fragen und Geschenke, die wirklich benutzt werden, mit Preis bei Amazon.',
  intro: 'Lehrkräfte an staatlichen Schulen dürfen Geschenke nur in kleinem Rahmen annehmen, und die Grenzen sind je Bundesland anders. Ein gutes Geschenk bleibt darunter und wird trotzdem benutzt. Drei Fragen.',
  kort: 'Bleib klein: laut familie.de gelten in Sachsen 20 Euro pro Geschenk, in Hamburg 20 Euro für ein Geschenk der Klasse und in Thüringen 25 Euro. Gut kommen Dinge für den Unterricht an (gute Stifte, Haftnotizen, Whiteboard-Marker), ein Thermobecher für die Pause oder Tee, dazu eine Karte vom Kind. Bargeld ist tabu.',
  questions: [
    { q: 'Was würde die Lehrkraft nutzen?', options: [
      { label: 'Etwas für den Unterricht', kw: 'stifte set', min: null, max: null },
      { label: 'Etwas für die Pause', kw: 'thermobecher', min: null, max: null },
      { label: 'Etwas zum Entspannen', kw: 'tee geschenkset', min: null, max: null },
      { label: 'Etwas zum Lesen', kw: 'leselampe buch', min: null, max: null } ] },
    { q: 'Für wen ist es?', options: [
      { label: 'Grundschule', kw: '', min: null, max: null },
      { label: 'Weiterführende Schule', kw: '', min: null, max: null },
      { label: 'Kita oder Erzieherin', kw: '', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 10 Euro', kw: '', min: null, max: 10 },
      { label: '10 bis 20 Euro', kw: '', min: 10, max: 20 } ] } ],
  guide: 'Die Regeln. Lehrkräfte an staatlichen Schulen sind Beamte oder Angestellte im öffentlichen Dienst. Sie dürfen Geschenke nur annehmen, wenn sie klein sind oder genehmigt wurden, und die Grenzen sind je Bundesland verschieden. Laut familie.de: Sachsen 20 Euro pro Geschenk und 60 Euro im Jahr, Hamburg 20 Euro für ein Geschenk der Klasse oder der Elternschaft, Thüringen 25 Euro, Berlin 50 Euro zu besonderen Anlässen wie einem Abschied. Viele Länder nennen keinen Betrag und sprechen von geringfügigen oder angemessenen Geschenken. Frag im Zweifel bei der Schule nach.\nKlassengeschenk. Wenn mehrere Eltern zusammenlegen, zählt das in manchen Ländern als ein Geschenk. Ein gemeinsames Geschenk ist oft schöner als viele kleine, solange es unter der Grenze bleibt.\nWas ankommt. Dinge für den Unterricht, die Lehrkräfte sonst selbst kaufen, ein Thermobecher für die Pause oder etwas zum Entspannen wie Tee. Tassen und Kerzen bekommen viele schon reichlich.\nDie Karte. Eine Karte oder ein Bild vom Kind ist oft das, was bleibt. Gib das Geschenk am letzten Schultag vor den Weihnachtsferien.',
  mistakes: ['Ein Klassengeschenk über der Grenze des Bundeslands.', 'Bargeld oder etwas mit hohem Wert schenken.', 'Die zehnte Tasse oder Kerze.', 'Die Karte vom Kind vergessen.'],
  aiMiss: ['Viele Geschenklisten erwähnen nicht, dass Lehrkräfte nur kleine Geschenke annehmen dürfen.', 'Kaum eine Liste nennt, dass die Grenzen je Bundesland verschieden sind.'],
  faq: [
    { q: 'Wie viel darf ein Geschenk für Lehrer kosten?', a: 'Das hängt vom Bundesland ab. Laut familie.de etwa 20 Euro pro Geschenk in Sachsen, 20 Euro für ein Klassengeschenk in Hamburg und 25 Euro in Thüringen. Viele Länder nennen keinen festen Betrag. Frag bei der Schule nach.' },
    { q: 'Ist ein Klassengeschenk erlaubt?', a: 'Ja, in kleinem Rahmen. In Hamburg sind Geschenke der Klasse oder Elternschaft bis 20 Euro ohne Genehmigung erlaubt. In anderen Ländern gelten eigene Regeln.' },
    { q: 'Was schenkt man einer Lehrerin zu Weihnachten?', a: 'Etwas, das sie benutzt: gute Stifte für den Unterricht, einen Thermobecher für die Pause oder Tee, dazu eine Karte vom Kind.' },
    { q: 'Dürfen Lehrer Geld annehmen?', a: 'Bargeld ist nicht erlaubt. Bleib bei einem kleinen Sachgeschenk.' } ]
};

// 14 nov 2026: uit de handwachtrij van keuzehulp.best (402 bij de AI Gateway), voor de VS met de hand geschreven
const USDUAL = {
  slug: 'best-dual-basket-air-fryers-black-friday-2026', term: 'dual basket air fryer', cat: 'Kitchen', vanaf: '2026-11-14', v: 1,
  title: 'Which dual basket air fryer should you buy this Black Friday?', h1: 'Dual basket air fryers (Black Friday 2026): which size and which features you need',
  seoTitle: 'Best dual basket air fryers for Black Friday 2026', metaDesc: 'Two baskets, one dinner. Answer 3 questions on household size, brand and budget and pick a dual basket air fryer, with today\'s Amazon price.',
  intro: 'A dual basket air fryer cooks two foods at once, at different temperatures, and can finish both at the same time. The right one depends on how many people you cook for and how much counter space you have. Three questions.',
  kort: 'For two to four people an 8-quart model with two 4-quart baskets is enough, such as the Ninja Foodi DualZone DZ201. For larger families look at 10 quarts or more. The feature that matters most is a sync function that finishes both baskets together (Ninja calls it Smart Finish). Measure your counter first: the DZ201 is about 15.6 x 13.9 x 12.4 inches according to Ninja.',
  questions: [
    { q: 'How many people do you cook for?', options: [
      { label: 'Two to four', kw: '8 quart', min: null, max: null },
      { label: 'Five or more', kw: '10 quart', min: null, max: null } ] },
    { q: 'Which brand do you prefer?', options: [
      { label: 'Ninja', kw: 'ninja dualzone', min: null, max: null },
      { label: 'Instant', kw: 'instant vortex', min: null, max: null },
      { label: 'Any brand', kw: '', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $120', kw: '', min: null, max: 120 },
      { label: '$120 to $200', kw: '', min: 120, max: 200 },
      { label: 'Over $200', kw: '', min: 200, max: null } ] } ],
  guide: 'Two baskets, two foods. The point of a dual basket model is cooking a main and a side at once, each at its own time and temperature. Ninja\'s DZ201 has two 4-quart baskets (8 quarts in total), 1690 watts and six programs: Air Fry, Air Broil, Roast, Bake, Reheat and Dehydrate.\nLook for a sync button. Smart Finish on Ninja models delays the shorter cook so both baskets are ready together; Match Cook copies the settings of one basket to the other when you cook a big batch of one food.\nSize per basket, not just in total. Two 4-quart baskets cannot fit a whole chicken the way one large basket can. If you roast whole birds, look at larger models or a model with a removable divider.\nCounter space. Two-basket models are wide. Measure the spot under your cabinets and leave room for steam.\nBlack Friday. Black Friday 2026 is on Friday, November 27, and Cyber Monday on November 30. Check today\'s price now so you can tell on the day whether a deal is real.',
  mistakes: ['Looking only at total quarts and not at the size of each basket.', 'Buying a model without a sync or finish-together function.', 'Not measuring counter space for a wide two-basket unit.', 'Trusting a "was" price without checking the price a few weeks earlier.'],
  aiMiss: ['Many lists compare total capacity only; per-basket size decides what fits.', 'Few lists explain that Smart Finish and Match Cook are two different features.'],
  faq: [
    { q: 'What size dual basket air fryer do I need?', a: 'Two 4-quart baskets (8 quarts total) suit two to four people. For five or more, look at 10 quarts or more.' },
    { q: 'What does Smart Finish do on a Ninja air fryer?', a: 'It times both baskets so they finish at the same time, even when the foods need different cook times. Match Cook copies one basket\'s settings to the other.' },
    { q: 'Can you cook a whole chicken in a dual basket air fryer?', a: 'Usually not in a 4-quart basket. Pick a larger model or one with a removable divider that turns two baskets into one.' },
    { q: 'When is Black Friday 2026?', a: 'Friday, November 27, 2026. Cyber Monday is November 30.' } ]
};
const USHIM150 = {
  slug: 'best-christmas-gifts-for-him-under-150-2026', term: 'gifts for him', cat: 'Gifts', vanaf: '2026-11-14', v: 1,
  title: 'Which Christmas gift under $150 fits him?', h1: 'Christmas gifts for him under $150 (2026): something he will actually use',
  seoTitle: 'Christmas gifts for him under $150 he will use (2026)', metaDesc: 'Music, grooming, grilling or fitness? Answer 3 questions and pick a Christmas gift for him under $150, with today\'s Amazon price.',
  intro: 'With $75 to $150 you can buy the thing he keeps putting off: good headphones, a beard trimmer that lasts, a wireless meat thermometer or a fitness tracker. What he does every week decides what fits. Three questions.',
  kort: 'Pick by what he does every week. If he listens to music or podcasts a lot, noise cancelling headphones get used every day. If he has a beard, a trimmer with several guard combs. If he grills or cooks, a wireless meat thermometer he can follow on his phone. If he works out, a fitness tracker or smartwatch that works with his phone: an Apple Watch only works with an iPhone.',
  questions: [
    { q: 'What is he into?', options: [
      { label: 'Music and podcasts', kw: 'noise cancelling headphones', min: null, max: null },
      { label: 'Grooming, he has a beard', kw: 'beard trimmer kit', min: null, max: null },
      { label: 'Grilling and cooking', kw: 'wireless meat thermometer', min: null, max: null },
      { label: 'Fitness and outdoors', kw: 'fitness tracker watch', min: null, max: null } ] },
    { q: 'Who is it for?', options: [
      { label: 'Husband or partner', kw: '', min: null, max: null },
      { label: 'Dad', kw: '', min: null, max: null },
      { label: 'Brother or friend', kw: '', min: null, max: null } ] },
    { q: 'What do you want to spend?', options: [
      { label: 'Under $75', kw: '', min: null, max: 75 },
      { label: '$75 to $150', kw: '', min: 75, max: 150 } ] } ],
  guide: 'Use beats wow. A gift at this price should be something he uses every week, so look at his habits, not at what looks good in a gift guide.\nHeadphones: noise cancelling is the big difference. On a commute, in an office or on a plane he hears much less background noise.\nBeard trimmers: check the guard combs, the length settings and whether it is waterproof for use in the shower.\nMeat thermometers: a wireless probe stays in the meat and reports to his phone, so he does not keep opening the grill or oven.\nWatches: check his phone. An Apple Watch only works with an iPhone; most other brands work with both Android and iPhone, but check the model.\nTiming: Black Friday 2026 is on November 27 and Christmas on Friday, December 25. Order early and keep the receipt.',
  mistakes: ['Buying a smartwatch that does not work with his phone.', 'Picking something he already owns.', 'Ordering in the last week before Christmas.'],
  aiMiss: ['Many "under $150" lists include gifts that cost far more.', 'Few lists remind you that an Apple Watch needs an iPhone.'],
  faq: [
    { q: 'What is a good Christmas gift for him under $150?', a: 'Something he uses often: noise cancelling headphones, a good beard trimmer, a wireless meat thermometer or a fitness tracker.' },
    { q: 'Does an Apple Watch work with Android?', a: 'No, an Apple Watch only works with an iPhone. For Android, choose another brand and check the model.' },
    { q: 'When is Black Friday 2026?', a: 'Friday, November 27, 2026. Cyber Monday is November 30.' },
    { q: 'When is Christmas 2026?', a: 'Friday, December 25, 2026.' } ]
};

// 18 nov 2026: batterijcluster uit Demand Radar (thema batterij). US: "solar generator" 49.500 vaste vraag per maand, "jackery solar generator" 33.100,
// "sump pump battery backup" 14.800. Feiten uit fabrikantpagina's, Popular Science (28 okt 2025), Bob Vila Amazon-deals (12 nov 2026), IRS, FAA, PowerOutage.us; gelezen 18 nov 2026.
const USSOLAR = {
  slug: 'best-solar-generators-for-home-backup-and-camping-2026', term: 'solar generator', cat: 'Electronics', vanaf: '2026-11-18', v: 1,
  title: 'Which solar generator fits your home backup or camping trip?', h1: 'Best solar generators in 2026: Jackery, EcoFlow, Anker SOLIX or Bluetti?',
  seoTitle: 'Best solar generators 2026: Jackery vs EcoFlow vs Anker', metaDesc: 'A solar generator is a power station plus solar panels. Answer 3 questions on use, size and budget: Jackery, EcoFlow, Anker or Bluetti kit.',
  intro: 'A solar generator is a portable power station sold together with folding solar panels. There is no engine and no fuel: the panels charge the battery, the battery runs your devices. Which one fits depends on what you want to run, how long, and how much sun you can catch. Three questions.',
  kort: 'For a fridge, lights and phones during an outage, pick about 2 kWh with at least 2,000 W output and 1,000 W solar input, such as the Bluetti Elite 200 V2 (2,073.6 Wh, 2,600 W, 1,000 W solar) or Jackery HomePower 2000 Plus v2 (2,048 Wh, 2,400 W). For camping and short outages, about 1 kWh is enough: Jackery Solar Generator 1000 v2 (1,070 Wh, 1,500 W, 400 W solar) or Anker SOLIX C1000. For a whole-home setup, the Anker SOLIX F3800 Plus (3,840 Wh, 6,000 W at 120/240 V) can be expanded.',
  questions: [
    { q: 'What will you use it for most?', options: [
      { label: 'Home backup during outages', kw: 'home backup lifepo4 2000wh', min: null, max: null },
      { label: 'Camping, RV or van', kw: 'portable camping', min: null, max: null },
      { label: 'Whole home with a transfer panel', kw: '240v expandable 3000wh', min: null, max: null } ] },
    { q: 'How much do you need to run?', options: [
      { label: 'Phones, lights, router, CPAP', kw: '1000wh', min: null, max: null },
      { label: 'Also a fridge or freezer', kw: '2000wh', min: null, max: null },
      { label: 'Fridge, well or sump pump and more', kw: '3000wh', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $700', kw: '', min: null, max: 700 },
      { label: '$700 to $1,500', kw: '', min: 700, max: 1500 },
      { label: 'Over $1,500', kw: '', min: 1500, max: null } ] } ],
  guide: 'What you are buying. A solar generator is a power station (a LiFePO4 battery with an inverter and outlets) plus one or more folding panels. Jackery, for example, sells the Solar Generator 1000 v2 as the Explorer 1000 v2 with a SolarSaga 200 W panel.\nSize in watt-hours. A fridge uses about 1 to 2 kWh a day and 300 to 800 W while running, with a start-up surge of two to three times that (Anker). A CPAP like the ResMed AirSense 11 is rated 65 W, more with the humidifier. Add up what you need for one day and pick a battery at least that size.\nOutput in watts. The inverter must handle your largest device plus its start-up surge. 1,500 W runs most kitchen devices one at a time; 2,400 W or more runs a fridge and a microwave together.\nSolar input decides recharge speed. The Jackery 1000 v2 takes up to 400 W of solar, the Bluetti Elite 200 V2 and AC200L 1,000 to 1,200 W, the Anker F3800 Plus up to 3,200 W. More panels only help if the input can take them, and real output on a cloudy day is far below the label.\nNew this fall. EcoFlow put the DELTA 3000 Gen4 (3,072 Wh) and DELTA 3800 Gen4 (3,763 Wh) on sale in the US on October 30, 2026, and Bluetti launched the Apex 200 (about 2.56 kWh, up to 3 kW solar) on November 4.\nTax credit. The federal residential clean energy credit (25D) is not available for property placed in service after December 31, 2025, according to the IRS. Do not count on it for a 2026 purchase.\nPrices move daily around Black Friday (November 27, 2026). The prices in this guide are from the maker or from Amazon deal reports on the date shown; check today\'s price below.',
  mistakes: ['Buying by battery size only and forgetting the start-up surge of a fridge or pump.', 'Adding more panels than the solar input can take.', 'Expecting the panel\'s rated watts on a cloudy winter day.', 'Running a generator kit indoors is fine, but never back-feed a house outlet without a transfer switch or home panel.'],
  aiMiss: ['Many answers still mention the 30% federal tax credit; the IRS says it ended for property placed in service after December 31, 2025.', 'Older lists miss the fall 2026 models: EcoFlow DELTA Gen4 and Bluetti Apex 200.', 'Jackery renamed its large kits to HomePower; the old Solar Generator 2000 Plus page now leads to the HomePower 2000 Plus v2.'],
  faq: [
    { q: 'What is a solar generator?', a: 'A portable power station sold together with solar panels. The panels charge the battery, and the battery powers your devices through AC outlets, USB and a car port. There is no engine and no fuel.' },
    { q: 'What size solar generator do I need to run a fridge?', a: 'About 2 kWh for a day. A fridge uses roughly 1 to 2 kWh a day and 300 to 800 W while running, with a start-up surge of two to three times that, so pick at least 1,800 to 2,400 W of output.' },
    { q: 'Is a Jackery solar generator worth it?', a: 'For camping and short outages the Solar Generator 1000 v2 (1,070 Wh, 1,500 W, 400 W solar, one 200 W panel) is a common pick. For home backup look at the HomePower 2000 Plus v2 (2,048 Wh, 2,400 W, expandable to 12 kWh). Compare price per watt-hour with EcoFlow, Anker and Bluetti.' },
    { q: 'Jackery or EcoFlow: which is better?', a: 'Both use LiFePO4 batteries. Compare the exact models: capacity, output, solar input and expansion. Popular Science (October 2025) picked the Bluetti Elite 200 V2 as best overall, the Anker SOLIX C1000 Gen 2 as best budget and the Jackery HomePower 3000 for home backup.' },
    { q: 'Do solar generators qualify for the federal tax credit in 2026?', a: 'No. The IRS says the residential clean energy credit is not available for property placed in service after December 31, 2025. Portable power stations generally did not qualify before either.' },
    { q: 'Can a solar generator power a whole house?', a: 'Only large expandable systems with a home panel, such as the Anker SOLIX F3800 Plus (3,840 Wh, 6,000 W at 120/240 V) with the Anker Home Power Panel, or EcoFlow DELTA Pro models with the Smart Home Panel 2. Smaller kits run selected devices.' } ]
};
const USSUMP = {
  slug: 'best-sump-pump-battery-backup-systems-2026', term: 'sump pump battery backup', cat: 'Home', vanaf: '2026-11-18', v: 1,
  title: 'Which sump pump battery backup do you need?', h1: 'Best sump pump battery backup in 2026: how much flow, which battery and how long it runs',
  seoTitle: 'Best sump pump battery backup 2026: GPH, battery, run time', metaDesc: 'Battery backup, combo system or water-powered? Answer 3 questions and pick a sump pump backup by flow at 10 feet, battery size and run time.',
  intro: 'A sump pump stops when the power goes out, which is often exactly when a storm fills the pit. A battery backup pump sits next to the main pump and takes over on a 12-volt battery. Three questions on your basement, your power and your budget.',
  kort: 'For most homes a standalone 12 V backup that pumps 1,000 to 2,300 gallons per hour at 10 feet is enough: the Basement Watchdog BWE (1,000 GPH at 10 ft) is the budget pick, the Wayne ESP25 (2,300 GPH at 10 ft) or Basement Watchdog Big Dog (2,200 GPH) suit a wetter basement. If your main pump is old, a combo system such as the Wayne BGSP50 replaces both. With city water of at least 40 PSI, a water-powered backup needs no battery at all. The battery is usually sold separately: buy a deep-cycle AGM or wet cell of 75 Ah or more.',
  questions: [
    { q: 'How wet does your basement get?', options: [
      { label: 'Some water in heavy storms', kw: '1000 gph', min: null, max: null },
      { label: 'The main pump runs often', kw: '2000 gph high capacity', min: null, max: null },
      { label: 'I also want to replace the main pump', kw: 'combo primary and backup', min: null, max: null } ] },
    { q: 'How do you want to power the backup?', options: [
      { label: '12 V battery', kw: '12v battery backup', min: null, max: null },
      { label: 'City water, no battery', kw: 'water powered backup', min: null, max: null },
      { label: 'Not sure yet', kw: '', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $200', kw: '', min: null, max: 200 },
      { label: '$200 to $400', kw: '', min: 200, max: 400 },
      { label: 'Over $400', kw: '', min: 400, max: null } ] } ],
  guide: 'Three types. A standalone battery backup pump sits in the pit next to your main pump and switches on with its own float when the water rises. A combo system replaces the main pump with a primary and a backup in one unit (for example the Wayne BGSP50). A water-powered backup uses city water pressure, needs at least 40 PSI, does not work on a well, and some towns restrict it (PowerOutage.us).\nFlow at 10 feet. Compare gallons per hour at 10 feet of lift, not at 0 feet. Examples from the makers and sellers: Wayne ESP25 2,300 GPH at 10 ft (3,300 at 0 ft), Basement Watchdog Big Dog 2,200 GPH, Zoeller Aquanot 508 1,800 GPH, Basement Watchdog BWE 1,000 GPH at 10 ft.\nThe battery decides the run time. Most backups ship without a battery. Basement Watchdog gives about 12 hours of continuous pumping for the BWE with its 7.5-hour battery; the Big Dog runs up to 50 hours of intermittent pumping on a 75 Ah battery; Zoeller gives 6 hours continuous or 48 hours at 10% duty for the Aquanot. Use a deep-cycle AGM or wet-cell battery (group 27 to 31) and replace it every few years.\nAlarm and Wi-Fi. A loud alarm or a phone alert (Basement Watchdog CONNECT models) tells you the backup is running or the battery is low.\nPrices on November 18, 2026: Basement Watchdog BWE $179 and BWSP $279 at Abt, Superior Pump 92900 $299.99 at Tractor Supply, Liberty 441 $410.25 at Ferguson. Check today\'s price below.',
  mistakes: ['Comparing flow at 0 feet instead of at 10 feet.', 'Forgetting that the battery is not included.', 'Using a car starter battery instead of a deep-cycle battery.', 'Installing a water-powered backup on a well or below 40 PSI.'],
  aiMiss: ['Many answers list GPH at 0 feet, which overstates real flow.', 'Few mention that run-time claims assume a specific battery size and duty cycle.'],
  faq: [
    { q: 'How long will a battery backup sump pump run?', a: 'It depends on the battery and how often the pump cycles. Basement Watchdog gives about 12 hours of continuous pumping for the BWE with its 7.5-hour battery and up to 50 hours of intermittent pumping for the Big Dog on a 75 Ah battery. Zoeller gives 6 hours continuous or 48 hours at 10% duty for the Aquanot 508.' },
    { q: 'What size battery do I need for a sump pump backup?', a: 'A deep-cycle 12 V AGM or wet-cell battery, group 27 to 31, of at least 75 Ah for most systems. Bigger batteries run longer.' },
    { q: 'What is the best sump pump battery backup?', a: 'For most basements a standalone 12 V unit with 1,000 to 2,300 GPH at 10 feet: Basement Watchdog BWE on a budget, Wayne ESP25 or Basement Watchdog Big Dog for more water, and a combo system like the Wayne BGSP50 if the main pump also needs replacing.' },
    { q: 'Is a water-powered backup sump pump better?', a: 'It needs no battery and runs as long as the water supply lasts, but it requires city water of at least 40 PSI, does not work on a well and uses a lot of water. Some towns restrict it.' },
    { q: 'Can a portable power station run a sump pump?', a: 'Yes, if the inverter handles the pump\'s start-up surge and the battery is large enough. A 1/3 HP pump draws several hundred watts while running; check the pump label and size the power station with margin.' } ]
};
// DE: "powerstation" 33.100 vaste vraag, "batteriespeicher" 22.200, "stromspeicher" 9.900, "starthilfe powerbank" 8.100 (Demand Radar 18 nov 2026).
// Feiten: Hersteller- und Händlerseiten (Abruf 18.11.2026), ADAC (11.06.2025 und 01.09.2026), Auto Bild (28.05.2026), Stiftung Warentest, Verbraucherzentrale NRW (02.07.2026), HTW (06.03.2026), MonsterDealz (19.10.2026).
const DEPOWER = {
  slug: 'powerstation-kaufen-2026-test-anker-ecoflow-jackery-bluetti', term: 'powerstation', cat: 'Energie', vanaf: '2026-11-18', v: 1,
  title: 'Welche Powerstation passt zu dir?', h1: 'Powerstation kaufen 2026: Anker SOLIX, EcoFlow, Jackery oder Bluetti im Vergleich',
  seoTitle: 'Powerstation Test 2026: Anker, EcoFlow, Jackery im Vergleich', metaDesc: 'Powerstation für Camping, Notstrom oder mit Solarpanel? 3 Fragen, Testergebnisse von ADAC und Auto Bild, Wh und Watt erklärt, Preise vom 18.11.2026.',
  intro: 'Eine Powerstation ist ein großer Akku mit Steckdosen, USB und Autoanschluss. Du lädst sie an der Steckdose, im Auto oder mit einem Solarpanel und betreibst damit Geräte beim Camping, im Garten oder bei einem Stromausfall. Welche passt, hängt davon ab, was du betreiben willst und wie lange. Drei Fragen.',
  kort: 'Für Camping, Garten und kurze Stromausfälle reicht meist etwa 1 kWh mit 1.500 bis 2.000 W: Anker SOLIX C1000 Gen 2 (1.024 Wh, 2.000 W), EcoFlow DELTA 3 Plus (1.024 Wh, 1.800 W) oder Jackery Explorer 1000 v2 (1.070 Wh, 1.500 W). Für Kühlschrank und Gefriertruhe über einen Tag eher 2 kWh, etwa Jackery Explorer 2000 v2 (2.042 Wh, 2.200 W). Testsieger bei Auto Bild (Mai 2026) ist die EcoFlow DELTA 3 Plus, beim ADAC (Juni 2025) die Bluetti AC180P. Ins Hausnetz einspeisen kann eine Powerstation nicht.',
  questions: [
    { q: 'Wofür brauchst du die Powerstation?', options: [
      { label: 'Camping, Wohnmobil, Garten', kw: 'camping lifepo4', min: null, max: null },
      { label: 'Notstrom bei Stromausfall', kw: 'notstrom usv lifepo4', min: null, max: null },
      { label: 'Mit Solarpanel autark', kw: 'mit solarpanel', min: null, max: null } ] },
    { q: 'Was willst du betreiben?', options: [
      { label: 'Handy, Laptop, Licht, Kühlbox', kw: '500wh', min: null, max: null },
      { label: 'Kühlschrank, Kaffeemaschine, Werkzeug', kw: '1000wh 2000w', min: null, max: null },
      { label: 'Mehrere große Geräte einen Tag lang', kw: '2000wh', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 400 Euro', kw: '', min: null, max: 400 },
      { label: '400 bis 800 Euro', kw: '', min: 400, max: 800 },
      { label: 'Über 800 Euro', kw: '', min: 800, max: null } ] } ],
  guide: 'Wattstunden und Watt. Die Kapazität in Wh sagt, wie lange es reicht; die Leistung in W, welches Gerät gleichzeitig läuft. Ein Gerät mit 100 W läuft an 1.024 Wh rechnerisch rund 8 bis 9 Stunden, abzüglich Verluste. Für Wasserkocher, Föhn oder Kreissäge brauchst du 2.000 W oder mehr.\nDie gängigen Modelle (Hersteller- und Händlerangaben, Abruf 18.11.2026): Anker SOLIX C1000 Gen 2 mit 1.024 Wh, 2.000 W, LiFePO4 und 11,3 kg (bei Alternate 510 Euro, derzeit nicht bestellbar); EcoFlow DELTA 3 Plus mit 1.024 Wh, 1.800 W und 12,5 kg (rund 680 bis 710 Euro); Jackery Explorer 1000 v2 mit 1.070 Wh, 1.500 W und 10,8 kg (569 Euro, ausverkauft); Jackery Explorer 2000 v2 mit 2.042 Wh, 2.200 W und 17,5 kg (rund 1.000 Euro); klein und leicht die EcoFlow RIVER 3 mit 245 Wh und 300 W (219,99 Euro). Die Bluetti AC180 und AC200L führt Bluetti im EU-Shop als ausgelaufen.\nTests. Auto Bild testete 22 Powerstations (veröffentlicht 28.05.2026, Preise von Juli 2025): Testsieger EcoFlow DELTA 3 Plus (1,2), Anker SOLIX C1000 (1,3), Preis-Leistungs-Sieger Bluetti EB3A (1,9). Der ADAC testete im Juni 2025 acht Modelle von 750 bis 1.500 Wh: Sieger Bluetti AC180P (2,0), EcoFlow DELTA 3 Plus (2,1); Ective BlackBox 10 und Jackery Explorer 1000 v2 bekamen 5,0, weil Laden aus dem Auto und Solar gleichzeitig zu Überspannung führen kann. Der Test der Stiftung Warentest ist von 2023 und betraf kleinere Geräte von 300 bis 700 W.\nMit Solarpanel. Achte auf die maximale Solarleistung der Powerstation; mehr Paneele helfen nur, wenn der Eingang sie aufnimmt.\nNotstrom. Eine Powerstation versorgt nur die Geräte, die du direkt anschließt. Ins Hausnetz einspeisen kann sie nicht, sagt die Stiftung Warentest; deshalb passt sie auch schlecht als Speicher fürs Balkonkraftwerk.\nPreise schwanken stark rund um den Black Friday (27.11.2026); vergleiche den Preis von heute bei Amazon.',
  mistakes: ['Nur auf die Wh schauen und vergessen, dass Wasserkocher oder Föhn 2.000 W brauchen.', 'Die Powerstation über eine Steckdose ins Hausnetz einspeisen wollen.', 'Gleichzeitig aus dem Auto und vom Solarpanel laden, wenn das Modell dafür nicht freigegeben ist (ADAC).', 'Ein ausgelaufenes Modell ohne Ersatzteile kaufen.'],
  aiMiss: ['Viele Antworten nennen noch den alten Warentest von 2023 mit kleinen Geräten; aktuelle Tests sind von ADAC (2025) und Auto Bild (2026).', 'Oft fehlt, dass Bluetti AC180 und AC200L im EU-Shop ausgelaufen sind.', 'Die ADAC-Warnung zur Jackery Explorer 1000 v2 beim gleichzeitigen Laden wird selten erwähnt.'],
  faq: [
    { q: 'Welche Powerstation ist Testsieger?', a: 'Bei Auto Bild (Mai 2026, 22 Geräte) die EcoFlow DELTA 3 Plus mit 1,2, vor der Anker SOLIX C1000 mit 1,3. Beim ADAC (Juni 2025, 8 Geräte) die Bluetti AC180P mit 2,0, vor der EcoFlow DELTA 3 Plus mit 2,1.' },
    { q: 'Welche Powerstation mit Solarpanel ist gut?', a: 'Gängige Kombinationen sind Anker SOLIX C1000 Gen 2, EcoFlow DELTA 3 Plus und Jackery Explorer 1000 v2 mit einem Faltpanel von 100 bis 220 W. Prüfe die maximale Solarleistung der Station und lade nicht gleichzeitig aus Auto und Solar, wenn der Hersteller das nicht erlaubt.' },
    { q: 'Wie viel Wh brauche ich für einen Kühlschrank?', a: 'Ein Kühlschrank braucht grob 1 bis 2 kWh am Tag und beim Anlaufen ein Vielfaches seiner Dauerleistung. Für einen Tag Notstrom eher 2 kWh und mindestens 1.500 W Ausgangsleistung.' },
    { q: 'Kann ich mit einer Powerstation das Haus versorgen?', a: 'Nur einzelne Geräte, die du direkt anschließt. Ins Hausnetz einspeisen kann eine Powerstation nicht. Für das ganze Haus brauchst du einen fest installierten Batteriespeicher mit Notstromfunktion.' },
    { q: 'Welche Anker Powerstation soll ich kaufen?', a: 'Die Anker SOLIX C1000 Gen 2 (1.024 Wh, 2.000 W, 11,3 kg) für Camping und kurze Ausfälle; die F2000 (2.048 Wh, 2.300 W, 30,5 kg) für mehr Kapazität, sie war am 18.11.2026 bei Galaxus nicht vorrätig.' } ]
};
const DEHAUS = {
  slug: 'stromspeicher-batteriespeicher-photovoltaik-kosten-2026', term: 'batteriespeicher', cat: 'Energie', vanaf: '2026-11-18', v: 1,
  title: 'Welcher Batteriespeicher passt zu deiner Photovoltaik?', h1: 'Batteriespeicher und Stromspeicher 2026: Kosten, Größe, Förderung und ob er sich lohnt',
  seoTitle: 'Batteriespeicher 2026: Kosten pro kWh, Größe, Förderung', metaDesc: 'Ein Stromspeicher kostet 300 bis 700 Euro pro kWh mit Einbau (Verbraucherzentrale). Welche Größe, welche Förderung, 0 % MwSt und HTW-Testsieger 2026.',
  intro: 'Ein Batteriespeicher hebt den Solarstrom deiner Photovoltaik für den Abend und die Nacht auf. Für eine Dachanlage ist das ein fest installierter Stromspeicher, für ein Balkonkraftwerk ein kleiner Speicher an der Steckdose. Hier liest du, was ein Stromspeicher kostet, welche Größe passt und welche Förderung es 2026 gibt.',
  kort: 'Ein Stromspeicher für die Dachanlage kostet laut Verbraucherzentrale NRW (Juli 2026) 300 bis 700 Euro pro kWh mit Einbau, ab 5 kWh; ein 10-kWh-Speicher also grob 3.000 bis 7.000 Euro. Als Größe gilt etwa 1,5 kWh pro 1.000 kWh Jahresverbrauch. Einen Zuschuss vom Bund gibt es nicht, aber 0 % Mehrwertsteuer auf Speicher zu Anlagen bis 30 kWp und den KfW-Kredit 270. Für Balkonkraftwerke gibt es eigene Speicher an der Steckdose.',
  questions: [
    { q: 'Wofür suchst du einen Speicher?', options: [
      { label: 'Balkonkraftwerk', kw: 'balkonkraftwerk speicher', min: null, max: null },
      { label: 'Photovoltaik auf dem Dach', kw: 'stromspeicher photovoltaik lifepo4', min: null, max: null },
      { label: 'Notstrom ohne Solar', kw: 'powerstation notstrom', min: null, max: null } ] },
    { q: 'Wie viel Strom verbraucht ihr im Jahr?', options: [
      { label: 'Bis 2.500 kWh', kw: '2 kwh', min: null, max: null },
      { label: '2.500 bis 4.500 kWh', kw: '5 kwh', min: null, max: null },
      { label: 'Mehr, mit Wärmepumpe oder E-Auto', kw: '10 kwh', min: null, max: null } ] },
    { q: 'Wie viel willst du für den Speicher ausgeben?', options: [
      { label: 'Bis 1.000 Euro', kw: '', min: null, max: 1000 },
      { label: '1.000 bis 3.000 Euro', kw: '', min: 1000, max: 3000 },
      { label: 'Über 3.000 Euro', kw: '', min: 3000, max: null } ] } ],
  guide: 'Kosten. Die Verbraucherzentrale NRW nennt 300 bis 700 Euro pro kWh Speicherkapazität inklusive Installation für Speicher ab 5 kWh (Stand 02.07.2026), mit fallender Tendenz; kleine Geräte sind pro kWh teurer. Daraus ergeben sich grob 1.500 bis 3.500 Euro für 5 kWh und 3.000 bis 7.000 Euro für 10 kWh. Notstrom kostet oft extra.\nGröße. Als Faustregel nennt die Verbraucherzentrale etwa 1,5 kWh Speicher pro 1.000 kWh Jahresverbrauch. Ein Haushalt mit 4.000 kWh landet also bei rund 6 kWh. Ein Speicher hält 10 bis 15 Jahre.\nLohnt sich das? Die Verbraucherzentrale nennt einen Speicher bei heutigen Preisen fast immer wirtschaftlich sinnvoll. Die Rechnung dahinter: Für eingespeisten Strom gibt es bis 10 kW 7,70 Cent pro kWh (August bis Dezember 2026), Strom aus dem Netz kostet im Schnitt 37 Cent (BDEW, Herbst 2026). Jede selbst genutzte kWh spart also rund 29 Cent.\nEffizienz. Die HTW Berlin verglich in der Stromspeicher-Inspektion 2026 zwölf Systeme. Spitze in der 10-kW-Klasse: Fox ESS PQ-H3-Ultra-10.0 mit einem System Performance Index von 97 %; bei 5 kW AC-gekoppelt SAX Power Home Plus, bei 5 kW Hybrid SMA Sunny Boy Smart Energy 5.0 mit Home Storage 6.5 knapp vor Kostal mit BYD HVS+ 7.7. Zwischen bestem und schlechtestem 10-kWh-System liegen rund 200 Euro im Jahr.\nFörderung. Der Bund gibt keinen Zuschuss. Der KfW-Kredit 270 ist ein Darlehen (bester Effektivzins im September 2026: 4,11 %), Antrag vor Vertragsabschluss. Einige Länder haben Programme, etwa Berlin SolarPLUS (bis 4.750 Euro für Speicher nur zusammen mit einer neuen PV-Anlage), Baden-Württemberg, Bremen und Sachsen; elf Länder, darunter Bayern und NRW, haben keines (ADAC, 01.09.2026). Auf Lieferung und Einbau eines Speichers zu einer PV-Anlage bis 30 kWp fallen 0 % Mehrwertsteuer an, auch beim Nachrüsten.\nBalkonkraftwerk. Für ein Balkonkraftwerk gibt es kleine Speicher an der Steckdose oder am Modul, mit höchstens 800 W ins Netz. Unseren Vergleich dazu findest du unter Balkonkraftwerk mit Speicher.',
  mistakes: ['Einen Speicher größer kaufen als der Überschuss an einem normalen Tag.', 'Annehmen, jeder Speicher liefere bei Stromausfall Notstrom.', 'Den KfW-Antrag erst nach Vertragsabschluss stellen.', 'Preise mit und ohne Installation vergleichen.'],
  aiMiss: ['Viele Antworten nennen noch Bundeszuschüsse für Speicher; 2026 gibt es nur den KfW-Kredit und einzelne Länderprogramme.', 'Die Ergebnisse der HTW-Stromspeicher-Inspektion 2026 fehlen oft.', 'Der Unterschied zwischen Dachspeicher und Balkonkraftwerk-Speicher wird selten klar gemacht.'],
  faq: [
    { q: 'Was kostet ein Batteriespeicher?', a: 'Laut Verbraucherzentrale NRW (Juli 2026) 300 bis 700 Euro pro kWh inklusive Installation für Speicher ab 5 kWh. Ein 10-kWh-Speicher kostet damit grob 3.000 bis 7.000 Euro. Speicher fürs Balkonkraftwerk mit rund 2 kWh kosten etwa 700 bis 1.000 Euro.' },
    { q: 'Was kostet ein Stromspeicher mit 10 kWh?', a: 'Grob 3.000 bis 7.000 Euro mit Einbau, gerechnet mit den 300 bis 700 Euro pro kWh der Verbraucherzentrale NRW. Hole mehrere Angebote ein und vergleiche, ob Notstrom und Energiemanagement enthalten sind.' },
    { q: 'Wie groß sollte ein Stromspeicher sein?', a: 'Die Verbraucherzentrale nennt als Faustregel etwa 1,5 kWh pro 1.000 kWh Jahresverbrauch. Bei 4.000 kWh im Jahr sind das rund 6 kWh.' },
    { q: 'Lohnt sich ein Stromspeicher 2026?', a: 'Die Verbraucherzentrale nennt ihn bei heutigen Preisen fast immer wirtschaftlich sinnvoll. Eingespeister Strom bringt bis 10 kW 7,70 Cent pro kWh, Netzstrom kostet im Schnitt 37 Cent: jede selbst genutzte kWh spart also rund 29 Cent.' },
    { q: 'Gibt es 2026 eine Förderung für Batteriespeicher?', a: 'Keinen Bundeszuschuss, aber den KfW-Kredit 270 und 0 % Mehrwertsteuer auf Speicher zu PV-Anlagen bis 30 kWp. Einige Länder fördern, etwa Berlin SolarPLUS; Bayern und NRW haben laut ADAC (September 2026) kein Landesprogramm.' },
    { q: 'Welcher Stromspeicher ist der beste?', a: 'In der HTW-Stromspeicher-Inspektion 2026 erreichte Fox ESS PQ-H3-Ultra-10.0 den Rekordwert von 97 % in der 10-kW-Klasse; bei 5 kW lagen SAX Power Home Plus (AC) und SMA Sunny Boy Smart Energy mit Home Storage (Hybrid) vorn.' } ]
};
const DESTART = {
  slug: 'starthilfe-powerbank-auto-diesel-benzin-2026', term: 'starthilfe powerbank', cat: 'Auto', vanaf: '2026-11-18', v: 1,
  title: 'Welche Starthilfe-Powerbank passt zu deinem Auto?', h1: 'Starthilfe-Powerbank 2026: wie viel Ampere für Benziner und Diesel',
  seoTitle: 'Starthilfe Powerbank 2026: Ampere für Benzin und Diesel', metaDesc: 'Welche Starthilfe-Powerbank für dein Auto? Benzin oder Diesel, Hubraum, Ampere: 3 Fragen, NOCO GB40 und GB70 erklärt, ADAC-Tipps und Fehler.',
  intro: 'Eine Starthilfe-Powerbank (Booster) startet ein Auto mit schwacher Batterie ohne zweites Auto und ohne Kabel zum Nachbarn. Wichtig sind Motorgröße, Benzin oder Diesel und die Temperatur. Drei Fragen.',
  kort: 'Für kleine und mittlere Benziner bis etwa 6 Liter Hubraum reicht ein Booster wie der NOCO GB40 (1.000 A, Diesel bis 3 l, rund 98 Euro). Für Diesel bis 6 Liter oder große Benziner bis 8 Liter eher der NOCO GB70 (2.000 A, rund 181 Euro). Beim Diesel eine Nummer größer wählen. Ampere-Angaben verschiedener Marken sind nicht direkt vergleichbar; schau auf die Freigabe für Benzin und Diesel in Litern.',
  questions: [
    { q: 'Welcher Motor?', options: [
      { label: 'Benziner bis 2 Liter', kw: '1000a', min: null, max: null },
      { label: 'Benziner über 2 Liter oder Diesel', kw: '2000a diesel', min: null, max: null },
      { label: 'Transporter, SUV, großer Diesel', kw: '3000a', min: null, max: null } ] },
    { q: 'Was soll er noch können?', options: [
      { label: 'Nur starten', kw: '', min: null, max: null },
      { label: 'Auch Handy laden (USB-C)', kw: 'usb c powerbank', min: null, max: null },
      { label: 'Mit Kompressor für Reifen', kw: 'kompressor', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 80 Euro', kw: '', min: null, max: 80 },
      { label: '80 bis 150 Euro', kw: '', min: 80, max: 150 },
      { label: 'Über 150 Euro', kw: '', min: 150, max: null } ] } ],
  guide: 'Motorgröße zählt. Die Hersteller geben an, bis zu welchem Hubraum ein Booster startet. Bei NOCO: GB20 mit 500 A für Benziner bis 4 Liter, GB40 mit 1.000 A für Benziner bis 6 und Diesel bis 3 Liter, GB50 mit 1.500 A für 7 und 4,5 Liter, GB70 mit 2.000 A für 8 und 6 Liter, GB150 mit 3.000 A für 9 und 7 Liter. Diesel braucht mehr Kraft: wähle eine Nummer größer.\nAmpere sind kein Vergleichsmaßstab. Jede Marke misst Spitzenstrom anders; vergleiche lieber die Freigabe in Litern für Benzin und Diesel.\nWas der ADAC sagt. Booster eignen sich laut ADAC vor allem für kleinere Motoren und helfen nicht bei völlig entladenen oder defekten Batterien. Der letzte ADAC-Test von Boostern ist von 2016 (Sieger Dino 136102); neuere Tests gibt es vom ADAC nicht.\nWinter. Lithium-Booster verlieren in der Kälte Leistung. Lagere ihn im Haus, lade ihn alle paar Monate nach und nimm ihn bei Frost mit ins Auto, wenn du losfährst.\nPreise am 18.11.2026 (Galaxus): NOCO GB40 98,18 Euro, NOCO GB70 181,45 Euro (Galaxus.at). Vergleiche den Preis von heute bei Amazon.',
  mistakes: ['Einen Booster nach Ampere-Werbung kaufen statt nach der Freigabe für Hubraum und Diesel.', 'Den Booster monatelang im kalten Auto liegen lassen, ohne nachzuladen.', 'Eine völlig entladene oder defekte Batterie mit einem Booster retten wollen.', 'Plus und Minus vertauschen; gute Geräte haben einen Verpolungsschutz.'],
  aiMiss: ['Viele Antworten vergleichen nur Ampere, obwohl die Marken unterschiedlich messen.', 'Oft fehlt, dass der letzte ADAC-Test von 2016 stammt.'],
  faq: [
    { q: 'Wie viel Ampere braucht eine Starthilfe-Powerbank?', a: 'Kleine Benziner bis 4 Liter starten mit etwa 500 A (NOCO GB20), Benziner bis 6 Liter und Diesel bis 3 Liter mit 1.000 A (GB40), Diesel bis 6 Liter mit 2.000 A (GB70). Vergleiche die Freigabe in Litern, nicht nur die Ampere.' },
    { q: 'Welche Starthilfe-Powerbank für Diesel?', a: 'Eine Nummer größer als beim Benziner. Für Diesel bis 3 Liter reicht der NOCO GB40 mit 1.000 A, für Diesel bis 6 Liter der GB70 mit 2.000 A, für 7 Liter der GB150.' },
    { q: 'Was sagt der ADAC zu Starthilfe-Powerbanks?', a: 'Sie eignen sich laut ADAC vor allem für kleinere Motoren und helfen nicht bei völlig entladenen oder defekten Batterien. Der letzte ADAC-Test von Boostern stammt von 2016.' },
    { q: 'Kann ich mit einer Starthilfe-Powerbank das Handy laden?', a: 'Die meisten Booster haben einen USB-Ausgang, viele auch USB-C. Als Handy-Powerbank sind sie aber schwer; für den Alltag ist eine normale Powerbank praktischer.' } ]
};
// 19 nov 2026 (chat keuzehulp-batterij): de drie oudste batterijgidsen met de hand herschreven op de grootste zoektermen uit Demand Radar (thema batterij).
// US: "portable power station" 246.000 per maand (laagste maand 74.000), "jackery" 110.000, "ecoflow" 110.000, "bluetti" 60.500, "anker solix" 60.500,
// "portable charger" 110.000, "anker power bank" 110.000, "power bank" 90.500. DE: "powerbank flugzeug" 27.100 (laagste 14.800).
// Feiten gelezen op 19 nov 2026: Popular Science best portable chargers (bijgewerkt 26 okt 2026), Anker productpagina Prime 26K, Bob Vila Amazon-deals (27 okt 2026),
// ICAO (27 mrt 2026), Your Mileage May Vary (12 jul 2026, FAA en Amerikaanse maatschappijen), AP via WTOP (7 apr 2026, Southwest), AeroXplorer (28 apr 2026, American),
// mobiflip (15 jan 2026) en Macwelt (2 aug 2026) over Lufthansa en Ryanair, Stiftung Warentest Powerbanks (7 jan 2026). Specs power stations: zie USSOLAR en DEPOWER.
const USPOWER = {
  slug: 'best-portable-power-stations-for-home-backup-2026', term: 'portable power station', cat: 'Electronics', vanaf: '2026-11-19', v: 1,
  title: 'Which portable power station do you need?', h1: 'Best portable power station in 2026: Jackery, EcoFlow, Anker SOLIX or Bluetti, by what you need to run',
  seoTitle: 'Best Portable Power Station 2026: Jackery, EcoFlow, Anker', metaDesc: 'Pick a portable power station by what it must run: 1 kWh for camping or a CPAP, 2 kWh for a fridge. Jackery, EcoFlow, Anker SOLIX and Bluetti compared.',
  intro: 'A portable power station is a big rechargeable battery with AC outlets, USB ports and a car socket. You charge it from the wall, the car or a solar panel, and it runs your devices when you camp or when the power goes out. The right size depends on what you want to run and for how long. Three questions.',
  kort: 'For camping, a CPAP or a short outage, about 1 kWh with 1,500 to 2,000 W is enough: Anker SOLIX C1000 Gen 2 (1,024 Wh, 2,000 W), EcoFlow DELTA 3 Plus (1,024 Wh, 1,800 W) or Jackery Explorer 1000 v2 (1,070 Wh, 1,500 W). To keep a fridge going for a day, pick about 2 kWh, such as the Bluetti Elite 200 V2 (2,073.6 Wh, 2,600 W) or the Jackery Explorer 2000 v2 (2,042 Wh, 2,200 W). For a whole home on a transfer panel, look at expandable 120/240 V systems like the Anker SOLIX F3800 Plus (3,840 Wh, 6,000 W).',
  questions: [
    { q: 'What will you use it for most?', options: [
      { label: 'Camping, RV or van', kw: 'camping lifepo4', min: null, max: null },
      { label: 'Backup during power outages', kw: 'home backup lifepo4', min: null, max: null },
      { label: 'Whole home with a transfer panel', kw: '240v expandable', min: null, max: null } ] },
    { q: 'What do you need to run?', options: [
      { label: 'Phones, laptop, lights', kw: '300wh', min: null, max: null },
      { label: 'A CPAP overnight or a fridge for a few hours', kw: '1000wh', min: null, max: null },
      { label: 'A fridge for a day, a microwave or tools', kw: '2000wh', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $500', kw: '', min: null, max: 500 },
      { label: '$500 to $1,000', kw: '', min: 500, max: 1000 },
      { label: 'Over $1,000', kw: '', min: 1000, max: null } ] } ],
  guide: 'Watt-hours and watts. Capacity in Wh tells you how long it lasts; output in W tells you what can run at the same time. A 100 W device runs about 8 to 9 hours on 1,024 Wh, minus conversion losses. A fridge uses roughly 1 to 2 kWh a day and 300 to 800 W while running, with a start-up surge of two to three times that (Anker). A ResMed AirSense 11 CPAP is rated 65 W, so one night of 8 hours needs about 520 Wh, more with the heated humidifier.\nThe common models. Anker SOLIX C1000 Gen 2: 1,024 Wh, 2,000 W. EcoFlow DELTA 3 Plus: 1,024 Wh, 1,800 W. Jackery Explorer 1000 v2: 1,070 Wh, 1,500 W, up to 400 W solar. Bluetti Elite 200 V2: 2,073.6 Wh, 2,600 W, 1,000 W solar. Jackery Explorer 2000 v2: 2,042 Wh, 2,200 W. Anker SOLIX F3800 Plus: 3,840 Wh, 6,000 W at 120/240 V, expandable. All of these use LiFePO4 cells, which last thousands of cycles.\nNew this fall. EcoFlow put the DELTA 3000 Gen4 (3,072 Wh) and DELTA 3800 Gen4 (3,763 Wh) on sale in the US on October 30, 2026, and Bluetti launched the Apex 200 (about 2.56 kWh) on November 4.\nPrices. Amazon deal prices reported by Bob Vila on October 27, 2026: Jackery Explorer 1000 v2 $499 (list $559), Anker SOLIX C1000 Gen 2 $699.99 ($799), Jackery Explorer 2000 v2 $899 ($999), Bluetti Elite 200 V2 $949 ($1,399), Jackery HomePower 2000 Plus v2 $1,069 ($1,199), Anker SOLIX F3800 Plus with an expansion battery $4,298.99 ($7,298). Prices move daily around Black Friday (November 27, 2026); today\'s prices are at the top of this page.\nRecharging. A wall outlet is fastest. With solar, the maximum solar input of the station decides the speed; more panels only help if the input can take them. A power station sold with panels is called a solar generator, see our solar generator guide.\nIndoors and in the house. A power station has no engine and no exhaust, so unlike a gas generator it can run indoors. It only powers what you plug into it. Never back-feed a house outlet; for circuits in your home you need a transfer switch or the maker\'s home panel.',
  mistakes: ['Buying on watt-hours only and forgetting the start-up surge of a fridge, pump or microwave.', 'Expecting to use every rated watt-hour: conversion losses mean you get less.', 'Adding more solar panels than the solar input can take.', 'Back-feeding a house outlet with a cable instead of using a transfer switch or home panel.'],
  aiMiss: ['Many lists still lead with models that were replaced: Jackery now sells the Explorer 1000 v2 and HomePower range, Anker the C1000 Gen 2.', 'Fall 2026 launches are often missing: EcoFlow DELTA 3000 and 3800 Gen4 (October 30) and Bluetti Apex 200 (November 4).', 'Few answers do the CPAP math: a 65 W machine needs about 520 Wh for 8 hours before the humidifier.'],
  faq: [
    { q: 'What is the best portable power station in 2026?', a: 'For most people a 1 kWh LiFePO4 model with 1,500 to 2,000 W, such as the Anker SOLIX C1000 Gen 2, EcoFlow DELTA 3 Plus or Jackery Explorer 1000 v2. Popular Science (October 2025) picked the Bluetti Elite 200 V2 as best overall and the Anker SOLIX C1000 Gen 2 as best budget.' },
    { q: 'Jackery or EcoFlow: which is better?', a: 'Neither brand wins across the board; compare the exact models. At 1 kWh the Jackery Explorer 1000 v2 has 1,070 Wh and 1,500 W, the EcoFlow DELTA 3 Plus 1,024 Wh and 1,800 W. Check output, solar input, weight and today\'s price.' },
    { q: 'Which Anker SOLIX power station should I buy?', a: 'The SOLIX C1000 Gen 2 (1,024 Wh, 2,000 W) for camping and short outages. The SOLIX F3800 Plus (3,840 Wh, 6,000 W at 120/240 V) if you want to connect it to a home panel and add batteries later.' },
    { q: 'What size portable power station do I need for a fridge?', a: 'About 2 kWh for a full day and at least 1,800 to 2,400 W of output. A fridge uses roughly 1 to 2 kWh a day and draws two to three times its running watts when the compressor starts.' },
    { q: 'Can a portable power station run a CPAP all night?', a: 'Yes. A ResMed AirSense 11 is rated 65 W, so 8 hours need about 520 Wh. A 1 kWh station covers one night with the humidifier off and leaves margin; with the heated humidifier on, plan for more.' },
    { q: 'What is the difference between a power station and a solar generator?', a: 'A solar generator is a portable power station sold together with solar panels. The battery and outlets are the same; the kit just adds panels to recharge it.' },
    { q: 'Can I use a portable power station indoors?', a: 'Yes. It has no engine and no exhaust, unlike a gas generator. Keep it dry, ventilated and away from heat, and plug devices straight into it.' } ]
};
const USBANK = {
  slug: 'best-power-banks-for-iphone-17-and-laptops-2026', term: 'power bank', cat: 'Electronics', vanaf: '2026-11-19', v: 1,
  title: 'Which portable charger should you buy?', h1: 'Best portable charger in 2026: which Anker power bank (or another one) fits your iPhone 17, Android or laptop',
  seoTitle: 'Best Portable Charger 2026: Anker Power Banks and Others', metaDesc: 'Which portable charger? 10,000 mAh for a phone, 20,000 to 26,250 mAh with 100 W or more for a laptop. Anker Prime, Zolo, MagGo and 2026 airline rules.',
  intro: 'A portable charger, also called a power bank, is a battery you carry to charge your phone, tablet or laptop on the go. The right one depends on what you charge, how you like to charge it and where you take it, including on a plane. Three questions.',
  kort: 'For a phone, a 10,000 mAh portable charger is enough: Popular Science (October 26, 2026) lists the Anker Zolo (10K, 30 W) at $29.99 as best budget and the Anker Power Bank (10K, Fusion, Built-In Cable) at $52.99. For magnetic charging on an iPhone, the Anker MagGo Power Bank 2 Pro (10,000 mAh, 45 W wired, up to 25 W wireless). For a laptop, pick 20,000 to 26,250 mAh with 100 W or more: the Anker Prime Power Bank (26K, 300 W, 99.75 Wh, $229.99 at Anker) or the cheaper UGREEN Nexode 25,000 mAh 145 W ($79.99). All of these stay under the 100 Wh airline limit.',
  questions: [
    { q: 'What do you need to charge?', options: [
      { label: 'My phone', kw: '10000mah usb c', min: null, max: null },
      { label: 'Phone and tablet', kw: '20000mah', min: null, max: null },
      { label: 'A laptop too', kw: 'laptop 100w usb c', min: null, max: null } ] },
    { q: 'How do you want to charge?', options: [
      { label: 'Fast with a cable', kw: 'usb c pd fast charging', min: null, max: null },
      { label: 'Magnetic on an iPhone (Qi2)', kw: 'magnetic qi2', min: null, max: null },
      { label: 'Built-in cable', kw: 'built in cable', min: null, max: null } ] },
    { q: 'What is your budget?', options: [
      { label: 'Under $35', kw: '', min: null, max: 35 },
      { label: '$35 to $80', kw: '', min: 35, max: 80 },
      { label: 'Over $80', kw: '', min: 80, max: null } ] } ],
  guide: 'Capacity in mAh and Wh. The mAh on the box is at the cell voltage; what reaches your phone is lower because of conversion losses in the bank and in the phone. As a rough guide, a 10,000 mAh bank charges a phone with a 4,000 to 5,000 mAh battery about 1.5 to 2 times. To get Wh, multiply mAh by 3.7 and divide by 1,000: 10,000 mAh is about 37 Wh, 20,000 mAh about 74 Wh, and the Anker Prime 26K is 99.75 Wh.\nWatts. A phone charges fine at 20 to 30 W. A laptop needs about what its own charger delivers: 65 W for most thin laptops, 100 W or 140 W for a 16-inch model, over USB-C Power Delivery with a cable rated for that wattage. Many banks split their output when two or three devices are plugged in, so read the per-port numbers.\nWhat Popular Science picked (updated October 26, 2026). Best overall: Anker Prime Power Bank (26K, 300W), 26,250 mAh, $229.99. Best for travel: UGREEN Nexode 20,000 mAh 130 W, $59.99. Best MagSafe: Anker MagGo Power Bank 2 Pro, 10,000 mAh, $109.99. Best for laptops: UGREEN Nexode 25,000 mAh 145 W, $79.99. Best budget: Anker Zolo (10K, 30W), $29.99.\nMagnetic charging. Qi2 packs snap onto an iPhone and charge without a cable, but slower than a cable and with more heat. Look for Qi2 or Qi2.2 on the listing, not only the word magnetic.\nFlying. Power banks go in your carry-on, never in checked bags. Up to 100 Wh is allowed without approval; 100 to 160 Wh needs airline approval (FAA). Airlines have added their own limits: Southwest allows one portable charger per passenger since April 20, 2026, and American since May 1, 2026 two of up to 100 Wh each, not in the overhead bin and not recharged in flight. For international flights ICAO set two per passenger and no recharging during the flight from March 27, 2026. Check your airline before you fly.',
  mistakes: ['Buying on mAh alone: a 25,000 mAh bank with only 30 W will barely charge a laptop.', 'Using a phone cable for a laptop: 100 W and more needs a cable rated for it.', 'Packing the power bank in checked luggage.', 'Bringing three power banks on a flight with a two-per-person or one-per-person rule.'],
  aiMiss: ['Many answers only mention the 100 Wh rule and miss the 2026 airline limits: Southwest one charger (April 20), American two (May 1), ICAO two for international flights (March 27).', 'Older lists still name the Anker 737 as the laptop pick; Anker now sells the Prime 26K with 300 W.', 'Qi2 is often mixed up with older magnetic packs that only use plain Qi.'],
  faq: [
    { q: 'What is the best portable charger?', a: 'It depends on what you charge. For a phone, a 10,000 mAh bank such as the Anker Zolo (10K, 30 W, $29.99 in Popular Science\'s October 2026 list). For a laptop, the Anker Prime Power Bank (26K, 300 W), which Popular Science named best overall, or the UGREEN Nexode 25,000 mAh 145 W as a cheaper laptop pick.' },
    { q: 'Which Anker power bank should I buy?', a: 'Anker Zolo (10K, 30 W) for a phone on a budget, Anker Power Bank (10K, Fusion, Built-In Cable) if you never want to carry a cable, Anker MagGo Power Bank 2 Pro for magnetic iPhone charging, and Anker Prime (26K, 300 W) for laptops.' },
    { q: 'Can you bring a portable charger on a plane?', a: 'Yes, in your carry-on only. Up to 100 Wh needs no approval and 100 to 160 Wh needs airline approval (FAA). Some airlines limit the number: Southwest allows one, American two. Never pack it in checked bags.' },
    { q: 'How many power banks can I bring on Southwest or American?', a: 'Southwest allows one portable charger per passenger since April 20, 2026. American allows two of up to 100 Wh each since May 1, 2026; they cannot go in the overhead bin or be recharged in flight.' },
    { q: 'Is a 26,250 mAh power bank allowed on a plane?', a: 'The Anker Prime 26K is rated 99.75 Wh, just under the 100 Wh limit, so it is allowed in carry-on without approval. Check the Wh printed on the case; above 100 Wh you need airline approval.' },
    { q: 'How many times will a 10,000 mAh power bank charge my phone?', a: 'Roughly 1.5 to 2 times for a phone with a 4,000 to 5,000 mAh battery. Conversion losses in the bank and in the phone mean you never get the full rated mAh.' },
    { q: 'Is a portable charger the same as a power bank?', a: 'Yes. Portable charger, power bank and battery pack mean the same thing: a battery that charges your devices on the go. A portable power station is the much bigger version with AC outlets.' } ]
};
const DEFLUG = {
  slug: 'powerbank-flugzeug-erlaubt-20000-mah-qi2-2026', term: 'powerbank', cat: 'Elektronik & Computer', vanaf: '2026-11-19', v: 1,
  title: 'Welche Powerbank darf mit ins Flugzeug und welche passt zu dir?', h1: 'Powerbank im Flugzeug 2026: was erlaubt ist, was Lufthansa und Ryanair verbieten und welche Powerbank passt',
  seoTitle: 'Powerbank im Flugzeug 2026: Lufthansa, Ryanair und ICAO', metaDesc: 'Powerbank im Flugzeug: nur Handgepäck, bis 100 Wh, höchstens 2 Stück. Seit 15.01.2026 verbietet Lufthansa Nutzen und Laden an Bord. 3 Fragen zur Auswahl.',
  intro: 'Eine Powerbank gehört ins Handgepäck, das war schon immer so. Neu sind 2026 die Regeln an Bord: wie viele du mitnehmen darfst, wo sie liegen muss und ob du sie benutzen darfst. Hier stehen die Regeln mit Datum, danach findest du mit drei Fragen die passende Reise-Powerbank.',
  kort: 'Eine Powerbank darf nur ins Handgepäck, bis 100 Wh ohne Genehmigung: 20.000 mAh sind rund 74 Wh, die Anker Prime mit 26.250 mAh hat 99,75 Wh. Seit dem 27. März 2026 gelten laut ICAO höchstens zwei Powerbanks pro Person, und die Powerbank darf während des Flugs nicht geladen werden. Bei den Airlines der Lufthansa Group darfst du sie seit dem 15. Januar 2026 an Bord auch nicht benutzen, und sie darf nicht ins Gepäckfach. Lade dein Handy also vor dem Abflug voll; für die Reise reicht meist eine Powerbank mit 10.000 bis 20.000 mAh und USB-C PD.',
  questions: [
    { q: 'Was willst du hauptsächlich laden?', options: [
      { label: 'Mein Handy', kw: '10000mah usb c', min: null, max: null },
      { label: 'Handy und Tablet', kw: '20000mah', min: null, max: null },
      { label: 'Auch den Laptop', kw: 'laptop 100w usb c', min: null, max: null } ] },
    { q: 'Was ist dir wichtig?', options: [
      { label: 'Klein und leicht', kw: 'klein leicht', min: null, max: null },
      { label: 'Magnetisch am iPhone (Qi2)', kw: 'magnetisch qi2', min: null, max: null },
      { label: 'Mit eingebautem Kabel', kw: 'integriertes kabel', min: null, max: null } ] },
    { q: 'Wie viel willst du ausgeben?', options: [
      { label: 'Bis 30 Euro', kw: '', min: null, max: 30 },
      { label: '30 bis 70 Euro', kw: '', min: 30, max: 70 },
      { label: 'Über 70 Euro', kw: '', min: 70, max: null } ] } ],
  guide: 'Die Grundregel. Powerbanks sind Lithium-Akkus und gehören ins Handgepäck, nie in den aufgegebenen Koffer. Bis 100 Wh sind sie ohne Genehmigung erlaubt, von 100 bis 160 Wh nur mit Zustimmung der Airline, darüber gar nicht.\nICAO seit 27. März 2026. Die Internationale Zivilluftfahrtorganisation begrenzt Powerbanks auf zwei pro Passagier und verbietet, sie während des Flugs aufzuladen. Viele Airlines haben das übernommen.\nLufthansa Group seit 15. Januar 2026. Powerbanks dürfen an Bord weder benutzt noch geladen werden. Erlaubt sind höchstens zwei, nur im Handgepäck. Sie müssen in der Sitztasche, am Körper oder im Handgepäck unter dem Vordersitz liegen, nicht im Gepäckfach (mobiflip, 15.01.2026). Für 100 bis 160 Wh brauchst du vorher die Genehmigung der Airline.\nRyanair. Höchstens 100 Wh, größere Powerbanks sind verboten. Die Powerbank selbst darfst du an Bord nicht laden; Geräte damit laden ist erlaubt, außer beim Rollen, beim Start und bei der Landung (Macwelt, 02.08.2026). Bei anderen Airlines schau vor dem Flug in die Gepäckbestimmungen, die Regeln ändern sich schnell.\nmAh in Wh. Wh = mAh × 3,7 ÷ 1.000. 10.000 mAh sind rund 37 Wh, 20.000 mAh rund 74 Wh, 27.000 mAh rund 100 Wh. Steht die Wh-Zahl nicht auf dem Gehäuse, kann es am Check-in Fragen geben.\nWas der Test sagt. Stiftung Warentest prüfte 24 Powerbanks von 18 Anbietern (veröffentlicht 07.01.2026). Nutzbar waren bei den kleinen Modellen 28,5 bis 35,8 Wh, bei den großen 58,3 bis 69,9 Wh, also weniger als aufgedruckt. Viele halten die angegebene Ladeleistung nicht dauerhaft, kabelloses Laden verliert mehr Energie als USB, und gute Geräte gibt es laut Test schon unter 40 Euro. Alle bestanden die Sicherheitsprüfung.\nAusstattung. Fürs Handy reichen 20 bis 30 W über USB-C, für einen Laptop brauchst du je nach Modell 45 bis 100 W. Qi2 lädt ein iPhone magnetisch ohne Kabel, aber langsamer und mit mehr Wärme.',
  mistakes: ['Die Powerbank im aufgegebenen Koffer einpacken.', 'Bei Lufthansa die Powerbank im Gepäckfach verstauen oder an Bord benutzen.', 'Drei Powerbanks mitnehmen, obwohl ICAO und Lufthansa höchstens zwei erlauben.', 'Nur auf mAh schauen: entscheidend ist die Wh-Zahl auf dem Gehäuse.', 'Eine aufgeblähte oder beschädigte Powerbank mitnehmen.'],
  aiMiss: ['Viele Antworten kennen das Nutzungsverbot der Lufthansa Group seit dem 15.01.2026 noch nicht.', 'Die ICAO-Grenze von zwei Powerbanks pro Person seit dem 27.03.2026 fehlt oft.', 'Der aktuelle Powerbank-Test der Stiftung Warentest ist vom Januar 2026; ältere Testsieger werden noch oft genannt.'],
  faq: [
    { q: 'Darf ich eine Powerbank mit ins Flugzeug nehmen?', a: 'Ja, aber nur im Handgepäck. Bis 100 Wh ohne Genehmigung, von 100 bis 160 Wh mit Zustimmung der Airline. Seit dem 27. März 2026 gelten laut ICAO höchstens zwei Powerbanks pro Person.' },
    { q: 'Darf ich die Powerbank bei Lufthansa benutzen?', a: 'Nein. Seit dem 15. Januar 2026 dürfen Powerbanks auf Flügen der Lufthansa Group Airlines weder benutzt noch geladen werden. Höchstens zwei, nur im Handgepäck, und nicht im Gepäckfach über dem Sitz.' },
    { q: 'Was gilt bei Ryanair für Powerbanks?', a: 'Höchstens 100 Wh. Die Powerbank darf an Bord nicht geladen werden; Geräte damit laden ist erlaubt, außer beim Rollen, Starten und Landen (Macwelt, August 2026).' },
    { q: 'Wie viele Powerbanks darf ich mitnehmen?', a: 'Nach den ICAO-Regeln seit dem 27. März 2026 höchstens zwei pro Person, bei Lufthansa ebenfalls zwei. Manche Airlines sind strenger, schau vor dem Flug nach.' },
    { q: 'Darf eine 20.000-mAh-Powerbank ins Flugzeug?', a: 'Ja, im Handgepäck. 20.000 mAh sind rund 74 Wh und liegen unter der Grenze von 100 Wh. Auch eine Powerbank mit 26.250 mAh wie die Anker Prime (99,75 Wh) liegt noch darunter.' },
    { q: 'Wie rechne ich mAh in Wh um?', a: 'mAh mal 3,7 geteilt durch 1.000. Beispiel: 20.000 mAh × 3,7 ÷ 1.000 = 74 Wh. Viele Hersteller drucken den Wh-Wert aufs Gehäuse.' },
    { q: 'Welche Powerbank ist Testsieger bei Stiftung Warentest?', a: 'Der aktuelle Test vom Januar 2026 mit 24 Powerbanks steht hinter der Bezahlschranke von test.de. Frei lesbar ist: Alle bestanden die Sicherheitsprüfung, die nutzbare Kapazität lag unter der Angabe, und gute Geräte gibt es schon unter 40 Euro.' } ]
};
// Onderwerpclusters: gidsen in één cluster linken altijd naar elkaar (api/wtb.js zelfdeCluster).
export const WTB_CLUSTER = {
  us: [['best-portable-power-stations-for-home-backup-2026', 'best-solar-generators-for-home-backup-and-camping-2026', 'best-sump-pump-battery-backup-systems-2026', 'best-power-banks-for-iphone-17-and-laptops-2026', 'best-portable-jump-starters-for-winter-car-batteries', 'best-dual-fuel-portable-generators-for-winter-storms-2026'],
    // dienstgidsen (lib/wtb-dienst.js, 19 nov 2026): Demand Radar AI-gaten zonder eerste keus
    ['where-to-book-a-hotel-near-me-tonight-or-this-weekend', 'massage-near-me-where-to-book-and-how-much-it-costs', 'dentists-how-to-find-one-with-or-without-insurance'],
    // leren en loopbaan (lib/wtb-dienst-us2.js, 20 nov 2026): Demand Radar AI-gaten online course en bootcamp coding
    ['online-courses-which-platform-to-pick-and-what-it-costs', 'coding-bootcamp-which-ones-still-enroll-and-what-they-cost']],
  de: [['balkonkraftwerk-speicher-2026-vergleich-anker-zendure-ecoflow-marstek', 'powerstation-kaufen-2026-test-anker-ecoflow-jackery-bluetti', 'stromspeicher-batteriespeicher-photovoltaik-kosten-2026', 'starthilfe-powerbank-auto-diesel-benzin-2026', 'powerbank-flugzeug-erlaubt-20000-mah-qi2-2026', 'wallbox-11-kw-pv-ueberschuss-heimladen-2026-unter-600-euro'],
    // dienstgidsen (lib/kb-dienst.js, 19 nov 2026): Demand Radar AI-gaten zonder eerste keus
    ['fuehrerschein-kosten-2026-theorie-app-fahrschule-ablauf', 'tagesgeld-vergleich-zinsen-2026-ohne-neukundenbonus', 'anwalt-erstberatung-kosten-online-fachanwalt-beratungshilfe', 'reinigung-hemd-preis-textilreinigung-in-der-naehe', 'wellnesshotel-buchen-wochenende-day-spa-kosten']]
};
export const WTB_HAND = { us: [US3D, USROBOT, USELEPHANT, USTEACHER, USDUAL, USHIM150, USSOLAR, USSUMP, USPOWER, USBANK], de: [DE3D, DEROBOT, DESPEICHER, DEWICHTEL, DELEHRER, DEPOWER, DEHAUS, DESTART, DEFLUG] };
