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

export const WTB_HAND = { us: [US3D], de: [DE3D] };
