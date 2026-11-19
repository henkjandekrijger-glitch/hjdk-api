// todayin surgery: lezerstekst per taal bij velden die in data/tsc-rank.json alleen als werknotitie (Nederlands) staan.
// Sleutel: <lijst>|<aanbieder>|<veld>. Veld: prijs, arts (wie opereert), gar (garantie en nazorg), risico:<nummer>.
// Ontbreekt een taal, dan toont de pagina dat veld in die taal NIET (liever leeg dan de verkeerde taal).
// Citaten van de site van de aanbieder blijven in de oorspronkelijke taal tussen aanhalingstekens.
// Nieuwe aanbieder of gewijzigde notitie in tsc-rank.json: hier dezelfde sleutel in en, nl en de bijwerken
// (scripts/test-tsc-provider.mjs faalt als een gepubliceerde aanbiederspagina een veld mist).

export const VELD = {
  'plastic-thailand|yanhee|prijs': {
    en: 'Nose reshaping THB 105,000 (2 nights), mid-facelift THB 165,000.',
    nl: 'Neuscorrectie THB 105.000 (2 nachten), mid-facelift THB 165.000.',
    de: 'Nasenkorrektur 105.000 THB (2 Nächte), Mid-Facelift 165.000 THB.' },
  'plastic-thailand|bangkokhospital|prijs': {
    en: 'Upper or lower eyelid surgery (local anaesthesia) THB 60,000, rhinoplasty (local anaesthesia) THB 46,000.',
    nl: 'Ooglidcorrectie boven of onder (lokale verdoving) THB 60.000, neuscorrectie (lokale verdoving) THB 46.000.',
    de: 'Ober- oder Unterlidkorrektur (örtliche Betäubung) 60.000 THB, Nasenkorrektur (örtliche Betäubung) 46.000 THB.' },
  'plastic-thailand|phyathai2|prijs': {
    en: 'Male to female gender surgery (colon technique) THB 500,000, including the doctor fee and 5 nights.',
    nl: 'Geslachtsbevestigende operatie man naar vrouw (met darmdeel) THB 500.000, inclusief artsenhonorarium en 5 nachten.',
    de: 'Geschlechtsangleichende Operation Mann zu Frau (mit Darmsegment) 500.000 THB, inklusive Arzthonorar und 5 Nächten.' },
  'plastic-thailand|siriroj|gar': {
    en: 'Written policy: report a problem within 12 months of surgery, and a committee decides between no surgery, a reduced-cost revision or a free revision.',
    nl: 'Schriftelijke regeling: meld een probleem binnen 12 maanden na de operatie, dan beslist een commissie over geen operatie, een revisie tegen lagere prijs of een gratis revisie.',
    de: 'Schriftliche Regel: ein Problem innerhalb von 12 Monaten nach der Operation melden, dann entscheidet ein Ausschuss zwischen keiner Operation, einer vergünstigten oder einer kostenlosen Korrektur.' },
  'plastic-thailand|bumrungrad|risico:0': {
    en: "Thailand's Supreme Court upheld a ruling that Bumrungrad and two doctors must jointly pay THB 1 million plus interest for negligence in failing to detect a child's birth defects. This was an obstetric case, not cosmetic surgery.",
    nl: 'Het Thaise hooggerechtshof bevestigde dat Bumrungrad en twee artsen samen THB 1 miljoen plus rente moeten betalen wegens nalatigheid: aangeboren afwijkingen van een kind werden niet ontdekt. Het ging om verloskunde, niet om cosmetische chirurgie.',
    de: 'Der Oberste Gerichtshof Thailands bestätigte, dass Bumrungrad und zwei Ärzte gemeinsam 1 Million THB plus Zinsen wegen Fahrlässigkeit zahlen müssen, weil Fehlbildungen eines Kindes nicht erkannt wurden. Es ging um Geburtshilfe, nicht um Schönheitschirurgie.' },
  'bbl-dr|pizzoglio|risico:0': {
    en: 'In August 2023 a court in Santo Domingo ordered him and the CECIP clinic together to pay a patient from Puerto Rico RD$5.86 million in damages for breaching the surgical protocol in a 2022 operation. There was no criminal conviction.',
    nl: 'In augustus 2023 veroordeelde een rechtbank in Santo Domingo hem en de kliniek CECIP samen tot RD$5,86 miljoen schadevergoeding aan een patiënte uit Puerto Rico, wegens schending van het operatieprotocol bij een operatie in 2022. Er was geen strafrechtelijke veroordeling.',
    de: 'Im August 2023 verurteilte ein Gericht in Santo Domingo ihn und die Klinik CECIP gemeinsam zu RD$5,86 Millionen Schadenersatz an eine Patientin aus Puerto Rico wegen Verstoßes gegen das OP-Protokoll bei einer Operation 2022. Eine strafrechtliche Verurteilung gab es nicht.' },
  'plastic-korea|ab|risico:0': {
    en: 'From 2018 to May 2026 the clinic gave promotional models undisclosed surgery discounts in exchange for positive reviews, the Korea Fair Trade Commission found in July 2026, in a case against three Seoul clinics. It received a corrective order. No fine was reported.',
    nl: 'Van 2018 tot mei 2026 gaf de kliniek promotiemodellen zonder vermelding korting op een operatie in ruil voor positieve reviews, stelde de Koreaanse mededingingsautoriteit (Fair Trade Commission) in juli 2026 vast, in een zaak tegen drie klinieken in Seoul. Ze kreeg een correctiebevel. Een boete werd niet gemeld.',
    de: 'Von 2018 bis Mai 2026 gab die Klinik Werbemodellen ohne Hinweis Rabatt auf Operationen für positive Bewertungen, stellte die koreanische Wettbewerbsbehörde (Fair Trade Commission) im Juli 2026 in einem Verfahren gegen drei Kliniken in Seoul fest. Sie erhielt eine Korrekturanordnung. Ein Bußgeld wurde nicht gemeldet.' },
  'plastic-korea|da|risico:0': {
    en: 'From 2018 to May 2026 the clinic gave promotional models undisclosed surgery discounts in exchange for positive reviews, the Korea Fair Trade Commission found in July 2026, in a case against three Seoul clinics. It was ordered not to repeat it. No fine was reported.',
    nl: 'Van 2018 tot mei 2026 gaf de kliniek promotiemodellen zonder vermelding korting op een operatie in ruil voor positieve reviews, stelde de Koreaanse mededingingsautoriteit (Fair Trade Commission) in juli 2026 vast, in een zaak tegen drie klinieken in Seoul. Ze kreeg het bevel dat niet te herhalen. Een boete werd niet gemeld.',
    de: 'Von 2018 bis Mai 2026 gab die Klinik Werbemodellen ohne Hinweis Rabatt auf Operationen für positive Bewertungen, stellte die koreanische Wettbewerbsbehörde (Fair Trade Commission) im Juli 2026 in einem Verfahren gegen drei Kliniken in Seoul fest. Ihr wurde untersagt, das zu wiederholen. Ein Bußgeld wurde nicht gemeldet.' },
  'plastic-korea|view|risico:0': {
    en: 'From 2018 to May 2026 the clinic gave promotional models undisclosed surgery discounts in exchange for positive reviews, the Korea Fair Trade Commission found in July 2026, in a case against three Seoul clinics. It received a corrective order and must publish a notice of it. No fine was reported.',
    nl: 'Van 2018 tot mei 2026 gaf de kliniek promotiemodellen zonder vermelding korting op een operatie in ruil voor positieve reviews, stelde de Koreaanse mededingingsautoriteit (Fair Trade Commission) in juli 2026 vast, in een zaak tegen drie klinieken in Seoul. Ze kreeg een correctiebevel en moet daar een mededeling over publiceren. Een boete werd niet gemeld.',
    de: 'Von 2018 bis Mai 2026 gab die Klinik Werbemodellen ohne Hinweis Rabatt auf Operationen für positive Bewertungen, stellte die koreanische Wettbewerbsbehörde (Fair Trade Commission) im Juli 2026 in einem Verfahren gegen drei Kliniken in Seoul fest. Sie erhielt eine Korrekturanordnung und muss darüber eine Mitteilung veröffentlichen. Ein Bußgeld wurde nicht gemeldet.' },
  'plastic-korea|view|prijs': {
    en: 'No fixed price. The provider guide gives an estimated range of US$10,000 to US$14,000 for breast augmentation with Motiva Ergonomix and says it includes the implant technique, endoscopic surgery and specialised aftercare. It does not specify consultation, anaesthesia, operating room, tests, medicines, both implants or revision surgery; a personal quote is needed.',
    nl: 'Geen vaste prijs. De gids van de aanbieder noemt US$10.000 tot US$14.000 voor een borstvergroting met Motiva Ergonomix en zegt dat implantaattechniek, endoscopische operatie en gespecialiseerde nazorg zijn inbegrepen. Consult, narcose, operatiekamer, onderzoeken, medicijnen, beide implantaten en een heroperatie zijn niet gespecificeerd; een persoonlijke offerte is nodig.',
    de: 'Kein Festpreis. Der Leitfaden des Anbieters nennt 10.000 bis 14.000 US-Dollar für eine Brustvergrößerung mit Motiva Ergonomix und sagt, dass Implantattechnik, endoskopische Operation und spezialisierte Nachsorge enthalten sind. Beratung, Narkose, OP-Saal, Untersuchungen, Medikamente, beide Implantate und eine Korrekturoperation sind nicht angegeben; ein persönliches Angebot ist nötig.' },
  'plastic-korea|view|arts': {
    en: 'The site describes a "Real-Name Surgery System": the surgeon is "fully responsible for every step" so that "no proxy surgeries occur". It also says there is CCTV in the operating rooms.',
    nl: 'De site beschrijft een "Real-Name Surgery System": de chirurg is "fully responsible for every step", zodat "no proxy surgeries occur". Ook staat er dat de operatiekamers CCTV hebben.',
    de: 'Die Website beschreibt ein "Real-Name Surgery System": der Chirurg ist "fully responsible for every step", damit "no proxy surgeries occur". Außerdem gebe es Videoüberwachung in den OPs.' },
  'plastic-korea|jw|arts': {
    en: 'The site says "All procedures are executed by board-certified plastic surgery specialists" and that each operating room has a camera, but does not name the surgeon who operates.',
    nl: 'De site zegt "All procedures are executed by board-certified plastic surgery specialists" en dat elke operatiekamer een camera heeft, maar noemt niet de chirurg die opereert.',
    de: 'Die Website sagt "All procedures are executed by board-certified plastic surgery specialists" und dass jeder OP eine Kamera hat, nennt aber nicht den operierenden Chirurgen.' },
  'plastic-korea|banobagi|arts': {
    en: 'The homepage says "Banobagi is against ghost surgeries" and describes a "REAL-NAME SYSTEM"; the rhinoplasty page says the surgeon "performs the entire procedure from start to finish". Four anaesthesiologists are named.',
    nl: 'De homepage zegt "Banobagi is against ghost surgeries" en beschrijft een "REAL-NAME SYSTEM"; de pagina over neuscorrectie zegt dat de chirurg "performs the entire procedure from start to finish". Vier anesthesiologen worden bij naam genoemd.',
    de: 'Die Startseite sagt "Banobagi is against ghost surgeries" und beschreibt ein "REAL-NAME SYSTEM"; die Seite zur Nasenkorrektur sagt, der Chirurg "performs the entire procedure from start to finish". Vier Anästhesisten werden namentlich genannt.' },
  'hair-turkey|asmed|arts': {
    en: 'The site says "Dr. Koray Erdogan personally creates these sites" (the incisions). Extraction and placement are not attributed to him; a technician, an anaesthetist and a coordinator are named.',
    nl: 'De site zegt "Dr. Koray Erdogan personally creates these sites" (de incisies). Extractie en plaatsing worden niet aan hem toegeschreven; een technicus, een anesthesist en een coördinator worden genoemd.',
    de: 'Laut Website: "Dr. Koray Erdogan personally creates these sites" (die Schnitte). Entnahme und Einsetzen werden ihm nicht zugeschrieben; genannt werden ein Techniker, ein Anästhesist und ein Koordinator.' },
  'hair-turkey|asmed|gar': {
    en: 'No guarantee mentioned. A coordinator follows recovery for 12 to 15 months. No office in the UK, Germany or the Netherlands. Note: asmed.com is a different company, an IT trainer in the US.',
    nl: 'Geen garantie genoemd. Een coördinator volgt het herstel 12 tot 15 maanden. Geen kantoor in het VK, Duitsland of Nederland. Let op: asmed.com is een ander bedrijf, een IT-opleider in de VS.',
    de: 'Keine Garantie genannt. Ein Koordinator begleitet die Heilung 12 bis 15 Monate. Kein Büro in Großbritannien, Deutschland oder den Niederlanden. Achtung: asmed.com ist ein anderes Unternehmen, ein IT-Schulungsanbieter in den USA.' },
  'hair-turkey|hlc|arts': {
    en: 'The site says the operation "will personally be performed by our hair surgeons" and adds "Only Surgeons!" and "No Assistants!". The founder is Dr. Özgür Öztan.',
    nl: 'De site zegt dat de ingreep "will personally be performed by our hair surgeons" en voegt toe "Only Surgeons!" en "No Assistants!". Oprichter is Dr. Özgür Öztan.',
    de: 'Laut Website wird der Eingriff "will personally be performed by our hair surgeons", dazu "Only Surgeons!" und "No Assistants!". Gründer ist Dr. Özgür Öztan.' },
  'hair-turkey|smile|prijs': {
    en: 'Gold EUR 2,390; Platinum EUR 3,290; Diamond EUR 5,790. The price is fixed before departure and does not change with the number of grafts.',
    nl: 'Gold EUR 2.390; Platinum EUR 3.290; Diamond EUR 5.790. De prijs staat vast vóór vertrek en verandert niet met het aantal grafts.',
    de: 'Gold 2.390 Euro; Platinum 3.290 Euro; Diamond 5.790 Euro. Der Preis steht vor der Abreise fest und ändert sich nicht mit der Zahl der Grafts.' },
  'hair-turkey|smile|arts': {
    en: 'Gold and Platinum: "Manual implantation by surgical technicians". In Gold technicians also make the incisions; in Platinum two doctors do. Diamond: "Performed exclusively by our founding doctors" or a senior doctor; the site does not specify this per step.',
    nl: 'Gold en Platinum: "Manual implantation by surgical technicians". Bij Gold maken technici ook de incisies, bij Platinum twee artsen. Diamond: "Performed exclusively by our founding doctors" of een senior arts; per stap staat het er niet.',
    de: 'Gold und Platinum: "Manual implantation by surgical technicians". Bei Gold setzen Techniker auch die Schnitte, bei Platinum zwei Ärzte. Diamond: "Performed exclusively by our founding doctors" oder ein leitender Arzt; pro Schritt ist das nicht angegeben.' },
  'hair-turkey|smile|gar': {
    en: 'No guarantee; a touch-up is described as the "standard remedy". A "1-Year Comprehensive Care Plan" with online check-ins. No office in the UK, Germany or the Netherlands (only Ümraniye, Istanbul).',
    nl: 'Geen garantie; een touch-up heet de "standard remedy". Een "1-Year Comprehensive Care Plan" met online check-ins. Geen kantoor in het VK, Duitsland of Nederland (alleen Ümraniye, Istanbul).',
    de: 'Keine Garantie; eine Nachbehandlung gilt als "standard remedy". Ein "1-Year Comprehensive Care Plan" mit Online-Kontrollen. Kein Büro in Großbritannien, Deutschland oder den Niederlanden (nur Ümraniye, Istanbul).' },
  'hair-turkey|vera|prijs': {
    en: 'EUR 2,990 to 5,890, depending on the package.',
    nl: 'EUR 2.990 tot 5.890, afhankelijk van het pakket.',
    de: '2.990 bis 5.890 Euro, je nach Paket.' },
  'hair-turkey|cosmedica|prijs': {
    en: 'FUE Sapphire from EUR 2,550 (up to 4,000 grafts; a mega session up to 6,000 costs EUR 900 more); Micro Sapphire DHI from EUR 3,290; VIP Micro Sapphire DHI from EUR 8,000.',
    nl: 'FUE Sapphire vanaf EUR 2.550 (tot 4.000 grafts; een megasessie tot 6.000 kost EUR 900 extra); Micro Sapphire DHI vanaf EUR 3.290; VIP Micro Sapphire DHI vanaf EUR 8.000.',
    de: 'FUE Sapphire ab 2.550 Euro (bis 4.000 Grafts; eine Megasitzung bis 6.000 kostet 900 Euro mehr); Micro Sapphire DHI ab 3.290 Euro; VIP Micro Sapphire DHI ab 8.000 Euro.' },
  'hair-turkey|cosmedica|arts': {
    en: 'Standard packages: only the consultation and the hairline design are by Dr. Acar; the site does not say who extracts and implants. Only VIP states "Operation incision by Dr. Acar". No technicians are named.',
    nl: 'Standaardpakketten: alleen het consult en het haarlijnontwerp zijn van Dr. Acar; wie extraheert en implanteert staat er niet. Alleen bij VIP staat "Operation incision by Dr. Acar". Technici worden niet genoemd.',
    de: 'Standardpakete: Nur Beratung und Haarlinie stammen von Dr. Acar; wer entnimmt und einsetzt, steht nicht da. Nur bei VIP heißt es "Operation incision by Dr. Acar". Techniker werden nicht genannt.' },
  'hair-turkey|cosmedica|gar': {
    en: 'A written "Growth & Graft Guarantee": a free revision if grafts do not grow and the patient is not at fault (exclusions include smoking and alcohol). No 12-month check is mentioned. No office or partner in the UK, Germany or the Netherlands; only "representatives for 19 countries".',
    nl: 'Een schriftelijke "Growth & Graft Guarantee": gratis revisie als grafts niet groeien buiten schuld van de patiënt (uitsluitingen onder meer roken en alcohol). Geen controle na 12 maanden genoemd. Geen kantoor of partner in het VK, Duitsland of Nederland; alleen "representatives for 19 countries".',
    de: 'Eine schriftliche "Growth & Graft Guarantee": kostenlose Korrektur, wenn Grafts ohne Verschulden des Patienten nicht wachsen (Ausschlüsse unter anderem Rauchen und Alkohol). Eine Kontrolle nach 12 Monaten wird nicht genannt. Kein Büro oder Partner in Großbritannien, Deutschland oder den Niederlanden; nur "representatives for 19 countries".' },
  'hair-turkey|aygin|prijs': {
    en: 'The site gives three figures that do not match: a Black Friday offer of EUR 3,200 (for surgery in May 2027), Turkey packages of about EUR 2,300 to 4,650, and a page title saying "ab 3.500 EUR".',
    nl: 'De site noemt drie bedragen die niet met elkaar kloppen: een Black Friday-actie van EUR 3.200 (voor een ingreep in mei 2027), Turkije-pakketten van ongeveer EUR 2.300 tot 4.650, en een paginatitel met "ab 3.500 EUR".',
    de: 'Die Website nennt drei Beträge, die nicht zusammenpassen: ein Black-Friday-Angebot von 3.200 Euro (für einen Eingriff im Mai 2027), Türkei-Pakete von etwa 2.300 bis 4.650 Euro und einen Seitentitel mit "ab 3.500 EUR".' },
  'hair-turkey|yaman|arts': {
    en: 'The site says Dr. Yaman "personally takes part in every patient\'s procedure"; it does not say in which steps.',
    nl: 'De site zegt dat Dr. Yaman "personally takes part in every patient\'s procedure"; bij welke stappen staat er niet.',
    de: 'Laut Website gilt: Dr. Yaman "personally takes part in every patient\'s procedure"; bei welchen Schritten, steht nicht da.' },
  'hair-turkey|elithair|prijs': {
    en: 'GBP 2,849 (up to 2,000 grafts) to GBP 3,449 (5,000 or more), plus GBP 85 per 500 extra grafts. The US site says "from $3,899".',
    nl: 'GBP 2.849 (tot 2.000 grafts) tot GBP 3.449 (5.000 of meer), plus GBP 85 per 500 extra grafts. De Amerikaanse site zegt "from $3,899".',
    de: '2.849 Pfund (bis 2.000 Grafts) bis 3.449 Pfund (5.000 oder mehr), dazu 85 Pfund je 500 weitere Grafts. Die US-Seite nennt "from $3,899".' },
  'hair-turkey|elithair|arts': {
    en: '"Trained medical specialists carry out the technical steps under medical supervision" and "A physician oversees every step". No operating doctor is named.',
    nl: '"Trained medical specialists carry out the technical steps under medical supervision" en "A physician oversees every step". Een opererende arts wordt niet genoemd.',
    de: '"Trained medical specialists carry out the technical steps under medical supervision" und "A physician oversees every step". Ein operierender Arzt wird nicht genannt.' },
  'hair-turkey|elithair|gar': {
    en: 'A "20-year written guarantee", on condition that you follow the aftercare instructions and document progress in the app; the exclusions are not published. 12 months of aftercare through the app. No office in the UK, Germany or the Netherlands. TÜV Thüringen certification (ISO 9001).',
    nl: 'Een "20-year written guarantee", op voorwaarde dat je de nazorginstructies volgt en de voortgang in de app vastlegt; de uitsluitingen zijn niet gepubliceerd. 12 maanden nazorg via de app. Geen kantoor in het VK, Duitsland of Nederland. Certificering van TÜV Thüringen (ISO 9001).',
    de: 'Eine "20-year written guarantee", unter der Bedingung, dass man die Nachsorgehinweise befolgt und den Verlauf in der App dokumentiert; die Ausschlüsse sind nicht veröffentlicht. 12 Monate Nachsorge per App. Kein Büro in Großbritannien, Deutschland oder den Niederlanden. Zertifizierung durch TÜV Thüringen (ISO 9001).' },
  'hair-turkey|cinik|prijs': {
    en: 'FUE EUR 2,350; DHI EUR 3,090; Premium Doctor EUR 3,590; Manual FUE EUR 3,990; Long Hair FUE EUR 5,200; Signature EUR 5,990. Elsewhere the site quotes pounds (Classic FUE GBP 1,995); the euro and pound amounts do not match.',
    nl: 'FUE EUR 2.350; DHI EUR 3.090; Premium Doctor EUR 3.590; Manual FUE EUR 3.990; Long Hair FUE EUR 5.200; Signature EUR 5.990. Elders noemt de site ponden (Classic FUE GBP 1.995); de bedragen in euro en pond kloppen niet met elkaar.',
    de: 'FUE 2.350 Euro; DHI 3.090 Euro; Premium Doctor 3.590 Euro; Manual FUE 3.990 Euro; Long Hair FUE 5.200 Euro; Signature 5.990 Euro. An anderer Stelle nennt die Website Pfund (Classic FUE 1.995 Pfund); die Euro- und Pfundbeträge passen nicht zusammen.' },
  'hair-turkey|cinik|arts': {
    en: 'Only Signature states "Channel Opening Performed by Dr. Emrah Cinik"; extraction is by "specialised technicians". Premium is a "Doctor-Supervised Procedure".',
    nl: 'Alleen bij Signature staat "Channel Opening Performed by Dr. Emrah Cinik"; de extractie is van "specialised technicians". Premium is een "Doctor-Supervised Procedure".',
    de: 'Nur bei Signature heißt es "Channel Opening Performed by Dr. Emrah Cinik"; die Entnahme machen "specialised technicians". Premium ist eine "Doctor-Supervised Procedure".' },
  'hair-turkey|cinik|gar': {
    en: 'No guarantee mentioned. Remote check-ins in week 1 and months 1, 3, 6 and 12; 24 months with Signature. A "Dr Cinik London" section without a confirmed physical address; German and Dutch are language versions only.',
    nl: 'Geen garantie genoemd. Controles op afstand in week 1 en maand 1, 3, 6 en 12; bij Signature 24 maanden. Een onderdeel "Dr Cinik London" zonder bevestigd adres; Duits en Nederlands zijn alleen taalversies.',
    de: 'Keine Garantie genannt. Fernkontrollen in Woche 1 und in den Monaten 1, 3, 6 und 12; bei Signature 24 Monate. Ein Abschnitt "Dr Cinik London" ohne bestätigte Adresse; Deutsch und Niederländisch sind nur Sprachversionen.' },
  'hair-turkey|cinik|risico:0': {
    en: 'A 38-year-old British patient died in the clinic in July 2025 before his operation started. Turkish authorities opened an investigation and the clinic says the courts are investigating.',
    nl: 'Een Britse patiënt van 38 overleed in juli 2025 in de kliniek, voordat zijn operatie begon. De Turkse autoriteiten zijn een onderzoek gestart en de kliniek zegt dat de rechter het onderzoekt.',
    de: 'Ein 38-jähriger britischer Patient starb im Juli 2025 in der Klinik, bevor seine Operation begann. Die türkischen Behörden haben Ermittlungen eingeleitet; nach Angaben der Klinik ermittelt die Justiz.' },
  'hair-turkey|clinicana|prijs': {
    en: 'Basic EUR 2,500 (procedure only); Standard EUR 2,850; Premium EUR 3,000; Premium Mega DHI EUR 4,500; Exosome EUR 3,950; Stem Cell VIP EUR 5,500.',
    nl: 'Basic EUR 2.500 (alleen de ingreep); Standard EUR 2.850; Premium EUR 3.000; Premium Mega DHI EUR 4.500; Exosome EUR 3.950; Stem Cell VIP EUR 5.500.',
    de: 'Basic 2.500 Euro (nur der Eingriff); Standard 2.850 Euro; Premium 3.000 Euro; Premium Mega DHI 4.500 Euro; Exosome 3.950 Euro; Stem Cell VIP 5.500 Euro.' },
  'hair-turkey|clinicana|gar': {
    en: 'A "Clinicana Guarantee Certificate": a promise to correct the agreed plan, explicitly without guaranteeing a biological result. A photo check at 6 to 12 months. No office in the UK, Germany or the Netherlands.',
    nl: 'Een "Clinicana Guarantee Certificate": de belofte het afgesproken plan te corrigeren, uitdrukkelijk zonder garantie op een biologisch resultaat. Fotocontrole na 6 tot 12 maanden. Geen kantoor in het VK, Duitsland of Nederland.',
    de: 'Ein "Clinicana Guarantee Certificate": das Versprechen, den vereinbarten Plan zu korrigieren, ausdrücklich ohne Garantie für ein biologisches Ergebnis. Fotokontrolle nach 6 bis 12 Monaten. Kein Büro in Großbritannien, Deutschland oder den Niederlanden.' },
  'hair-turkey|estenove|prijs': {
    en: 'EUR 3,395, 4,595 or 6,595 depending on the package (Sapphire FUE EUR 3,395).',
    nl: 'EUR 3.395, 4.595 of 6.595, afhankelijk van het pakket (Sapphire FUE EUR 3.395).',
    de: '3.395, 4.595 oder 6.595 Euro je nach Paket (Sapphire FUE 3.395 Euro).' },
  'hair-turkey|estefavor|prijs': {
    en: 'USD 2,000 to 4,500.', nl: 'USD 2.000 tot 4.500.', de: '2.000 bis 4.500 US-Dollar.' },
  'hair-turkey|estefavor|arts': {
    en: '"The senior doctor personally conducts the hairline design"; for the channels the doctor "performs or directly supervises". Extraction is not attributed to a doctor.',
    nl: '"The senior doctor personally conducts the hairline design"; bij de kanalen geldt "performs or directly supervises". De extractie wordt niet aan een arts toegeschreven.',
    de: '"The senior doctor personally conducts the hairline design"; bei den Kanälen gilt "performs or directly supervises". Die Entnahme wird keinem Arzt zugeschrieben.' },
  'hair-turkey|sule|prijs': {
    en: 'EUR 2,990 (Renew Basic) to EUR 5,500 (Platinum Total Care), across seven packages.',
    nl: 'EUR 2.990 (Renew Basic) tot EUR 5.500 (Platinum Total Care), verdeeld over zeven pakketten.',
    de: '2.990 Euro (Renew Basic) bis 5.500 Euro (Platinum Total Care), verteilt auf sieben Pakete.' },
  'hair-turkey|sule|arts': {
    en: 'Dr. Enver Kayikcioglu makes the incisions. The site states "Not performed by him: graft extraction, graft sorting and implantation"; a team of assistant practitioners does those, explicitly without a medical licence.',
    nl: 'Dr. Enver Kayikcioglu maakt de incisies. De site zegt "Not performed by him: graft extraction, graft sorting and implantation"; dat doet een team van assistenten, uitdrukkelijk zonder medische licentie.',
    de: 'Dr. Enver Kayikcioglu setzt die Schnitte. Die Website sagt "Not performed by him: graft extraction, graft sorting and implantation"; das übernimmt ein Assistententeam, ausdrücklich ohne ärztliche Zulassung.' },
  'hair-turkey|sule|gar': {
    en: 'Explicitly no result guarantee and no lifetime guarantee. A 12-month follow-up programme with seven photo moments through a portal. No office in the UK, Germany or the Netherlands.',
    nl: 'Uitdrukkelijk geen resultaatgarantie en geen levenslange garantie. Een nazorgprogramma van 12 maanden met zeven fotomomenten via een portaal. Geen kantoor in het VK, Duitsland of Nederland.',
    de: 'Ausdrücklich keine Ergebnis- und keine lebenslange Garantie. Ein Nachsorgeprogramm über 12 Monate mit sieben Fototerminen über ein Portal. Kein Büro in Großbritannien, Deutschland oder den Niederlanden.' },
  'hair-turkey|hairmedico|prijs': {
    en: 'The site gives two different starting prices: "from EUR 3,200" at the top of the page and "from EUR 2,600" elsewhere. Prices for Silver, Gold and VIP are not published.',
    nl: 'De site noemt twee verschillende vanafprijzen: "vanaf EUR 3.200" bovenaan de pagina en "vanaf EUR 2.600" elders. Prijzen voor Silver, Gold en VIP staan er niet.',
    de: 'Die Website nennt zwei verschiedene Einstiegspreise: "ab 3.200 Euro" oben auf der Seite und "ab 2.600 Euro" an anderer Stelle. Preise für Silver, Gold und VIP stehen nicht da.' },
  'hair-turkey|hairmedico|arts': {
    en: 'Dr. Arslan Musbeh opens the channels in Gold and VIP. Extraction and placement are his in VIP only ("Graft placement is also his personally in the VIP package"); in Silver and Gold the team places the grafts.',
    nl: 'Dr. Arslan Musbeh maakt de kanalen bij Gold en VIP. Extractie en plaatsing doet hij alleen bij VIP zelf ("Graft placement is also his personally in the VIP package"); bij Silver en Gold plaatst het team.',
    de: 'Dr. Arslan Musbeh öffnet die Kanäle bei Gold und VIP. Entnahme und Einsetzen übernimmt er nur bei VIP selbst ("Graft placement is also his personally in the VIP package"); bei Silver und Gold setzt das Team ein.' },
  'hair-turkey|hairmedico|gar': {
    en: 'No written guarantee. Check-ins in week 2 and months 1, 3, 6, 9 and 12 by WhatsApp. No office in the UK, Germany or the Netherlands (Levent, Beşiktaş).',
    nl: 'Geen schriftelijke garantie. Controles in week 2 en maand 1, 3, 6, 9 en 12 via WhatsApp. Geen kantoor in het VK, Duitsland of Nederland (Levent, Beşiktaş).',
    de: 'Keine schriftliche Garantie. Kontrollen in Woche 2 und in den Monaten 1, 3, 6, 9 und 12 per WhatsApp. Kein Büro in Großbritannien, Deutschland oder den Niederlanden (Levent, Beşiktaş).' },
  'hair-turkey|medart|prijs': {
    en: 'Premium EUR 2,950; Elite EUR 3,750; Luxury EUR 4,500; Long FUE and Mega Session EUR 6,250. These are cash prices.',
    nl: 'Premium EUR 2.950; Elite EUR 3.750; Luxury EUR 4.500; Long FUE en Mega Session EUR 6.250. Dit zijn prijzen bij contante betaling.',
    de: 'Premium 2.950 Euro; Elite 3.750 Euro; Luxury 4.500 Euro; Long FUE und Mega Session 6.250 Euro. Das sind Preise bei Barzahlung.' },
  'hair-turkey|medart|arts': {
    en: '"Experienced extraction specialists carry out graft extraction". A doctor makes the hairline incisions and starts the DHI implantation; extraction by a doctor costs EUR 1,000 extra.',
    nl: '"Experienced extraction specialists carry out graft extraction". Een arts maakt de incisies van de haarlijn en begint de DHI-implantatie; extractie door een arts kost EUR 1.000 extra.',
    de: '"Experienced extraction specialists carry out graft extraction". Ein Arzt setzt die Schnitte der Haarlinie und beginnt die DHI-Implantation; die Entnahme durch einen Arzt kostet 1.000 Euro extra.' },
  'hair-turkey|medart|gar': {
    en: 'A guarantee with "full terms in writing with your treatment plan". The price configurator lists "1 Year Post-Op Follow-Up" at EUR 0. No office in the UK, Germany or the Netherlands (Şişli). Note: medartclinic.com is a different clinic (Cyprus and Athens).',
    nl: 'Een garantie met "full terms in writing with your treatment plan". De prijsconfigurator noemt "1 Year Post-Op Follow-Up" voor EUR 0. Geen kantoor in het VK, Duitsland of Nederland (Şişli). Let op: medartclinic.com is een andere kliniek (Cyprus en Athene).',
    de: 'Eine Garantie mit "full terms in writing with your treatment plan". Der Preiskonfigurator führt "1 Year Post-Op Follow-Up" für 0 Euro. Kein Büro in Großbritannien, Deutschland oder den Niederlanden (Şişli). Achtung: medartclinic.com ist eine andere Klinik (Zypern und Athen).' },
  'hair-turkey|cliniccenter|prijs': {
    en: 'FUE GBP 1,500 to 2,100; Sapphire FUE GBP 1,750 to 2,200; DHI GBP 1,700 to 2,200.',
    nl: 'FUE GBP 1.500 tot 2.100; Sapphire FUE GBP 1.750 tot 2.200; DHI GBP 1.700 tot 2.200.',
    de: 'FUE 1.500 bis 2.100 Pfund; Sapphire FUE 1.750 bis 2.200 Pfund; DHI 1.700 bis 2.200 Pfund.' },
  'hair-turkey|cliniccenter|gar': {
    en: 'A "Guarantee certificate" and free re-treatment in case of malpractice; the terms are not published. 12 months of support and photo checks. Free aftercare appointments in the UK and Germany and an office in London; none in the Netherlands.',
    nl: 'Een "Guarantee certificate" en gratis herbehandeling bij een behandelfout; de voorwaarden zijn niet gepubliceerd. 12 maanden begeleiding en fotocontroles. Gratis nazorgafspraken in het VK en Duitsland en een kantoor in Londen; niet in Nederland.',
    de: 'Ein "Guarantee certificate" und kostenlose Nachbehandlung bei einem Behandlungsfehler; die Bedingungen sind nicht veröffentlicht. 12 Monate Betreuung und Fotokontrollen. Kostenlose Nachsorgetermine in Großbritannien und Deutschland und ein Büro in London; keines in den Niederlanden.' },
  'hair-turkey|istanbulhaircenter|prijs': {
    en: 'EUR 2,000 to 3,000 per package.', nl: 'EUR 2.000 tot 3.000 per pakket.', de: '2.000 bis 3.000 Euro je Paket.' },
  'hair-turkey|istanbulhaircenter|arts': {
    en: '"Carried out in our Istanbul clinic, by our own physicians". Dr. Erman Yilmaz and a specialist named Fatih are mentioned; the steps are not assigned.',
    nl: '"Carried out in our Istanbul clinic, by our own physicians". Dr. Erman Yilmaz en een specialist met de naam Fatih worden genoemd; de stappen zijn niet toegewezen.',
    de: '"Carried out in our Istanbul clinic, by our own physicians". Genannt werden Dr. Erman Yilmaz und ein Spezialist namens Fatih; die Schritte sind nicht zugeordnet.' },
  'hair-turkey|istanbulhaircenter|gar': {
    en: 'No guarantee. Follow-up in months 1, 3, 6 and 12 in your own language. No office in the UK, Germany or the Netherlands (Şişli).',
    nl: 'Geen garantie. Controles in maand 1, 3, 6 en 12 in je eigen taal. Geen kantoor in het VK, Duitsland of Nederland (Şişli).',
    de: 'Keine Garantie. Kontrollen in den Monaten 1, 3, 6 und 12 in der eigenen Sprache. Kein Büro in Großbritannien, Deutschland oder den Niederlanden (Şişli).' },
  'hair-turkey|naturalhair|prijs': {
    en: 'EUR 1,600 (procedure only); EUR 1,800 with three hotel nights; EUR 2,100 with a fibroblast treatment.',
    nl: 'EUR 1.600 (alleen de ingreep); EUR 1.800 met drie hotelnachten; EUR 2.100 met een fibroblastbehandeling.',
    de: '1.600 Euro (nur der Eingriff); 1.800 Euro mit drei Hotelnächten; 2.100 Euro mit einer Fibroblastenbehandlung.' },
  'hair-turkey|naturalhair|gar': {
    en: 'No guarantee. 12 months of follow-up. No office in the UK, Germany or the Netherlands (Ataköy, Bakırköy). Several clinics use a similar name; check that you are dealing with this one.',
    nl: 'Geen garantie. 12 maanden nazorg. Geen kantoor in het VK, Duitsland of Nederland (Ataköy, Bakırköy). Meerdere klinieken gebruiken een vergelijkbare naam; controleer dat je met deze te maken hebt.',
    de: 'Keine Garantie. 12 Monate Nachsorge. Kein Büro in Großbritannien, Deutschland oder den Niederlanden (Ataköy, Bakırköy). Mehrere Kliniken tragen einen ähnlichen Namen; prüfen Sie, dass es diese ist.' },
  'hair-turkey|gethair|prijs': {
    en: 'USD 1,899 to 3,549 for the Turkey packages.', nl: 'USD 1.899 tot 3.549 voor de Turkije-pakketten.', de: '1.899 bis 3.549 US-Dollar für die Türkei-Pakete.' },

  'tummy-mexico|pantoja|arts': {
    en: 'The tummy tuck page names no surgeon who operates personally; only patient stories name Dr. Pantoja as the treating doctor.',
    nl: 'De pagina over de buikwandcorrectie noemt geen chirurg die zelf opereert; alleen patiëntverhalen noemen Dr. Pantoja als behandelaar.',
    de: 'Die Seite zur Bauchdeckenstraffung nennt keinen Chirurgen, der selbst operiert; nur Patientenberichte nennen Dr. Pantoja als Behandler.' },
  'tummy-mexico|vida|prijs': {
    en: '$4,500 for a full tummy tuck, including surgeon, facility and anaesthesia; a mini tummy tuck averages $3,800.',
    nl: '$4.500 voor een volledige buikwandcorrectie, inclusief chirurg, operatiekamer en narcose; een mini-buikwandcorrectie kost gemiddeld $3.800.',
    de: '4.500 Dollar für eine vollständige Bauchdeckenstraffung, einschließlich Chirurg, OP und Narkose; eine Mini-Bauchdeckenstraffung kostet im Schnitt 3.800 Dollar.' },
  'tummy-mexico|balza|arts': {
    en: 'The site says "Dr. Isabel Balza is a board-certified plastic surgeon specializing in cosmetic and plastic surgery". It does not say explicitly that she operates herself, and no anaesthesiologist is named.',
    nl: 'De site zegt "Dr. Isabel Balza is a board-certified plastic surgeon specializing in cosmetic and plastic surgery". Dat zij zelf opereert staat er niet uitdrukkelijk, en een anesthesioloog wordt niet genoemd.',
    de: 'Die Website sagt "Dr. Isabel Balza is a board-certified plastic surgeon specializing in cosmetic and plastic surgery". Dass sie selbst operiert, steht nicht ausdrücklich da; ein Anästhesist wird nicht genannt.' },
  'tummy-mexico|vega|arts': {
    en: '"Dr. Vega will close the incisions and apply sterile surgical dressings". No anaesthesiologist is named, and the text contradicts itself on the type of anaesthesia.',
    nl: '"Dr. Vega will close the incisions and apply sterile surgical dressings". Een anesthesioloog wordt niet genoemd, en de tekst spreekt zichzelf tegen over het soort narcose.',
    de: '"Dr. Vega will close the incisions and apply sterile surgical dressings". Ein Anästhesist wird nicht genannt, und der Text widerspricht sich bei der Art der Narkose.' },
  'tummy-mexico|camberos|arts': {
    en: 'The tummy tuck page says he "combines lipocontouring and abdominoplasty in all cases". The team includes "anesthesiologists", and the anaesthesiologist\'s fee is in the price.',
    nl: 'De pagina over de buikwandcorrectie zegt dat hij "combines lipocontouring and abdominoplasty in all cases". Het team bestaat onder meer uit "anesthesiologists", en het honorarium van de anesthesioloog zit in de prijs.',
    de: 'Die Seite zur Bauchdeckenstraffung sagt, er "combines lipocontouring and abdominoplasty in all cases". Zum Team gehören "anesthesiologists"; das Honorar des Anästhesisten ist im Preis enthalten.' },
  'tummy-mexico|marciales|arts': {
    en: '"Dr. Marciales removes excess skin and fat". The FAQ says "Anesthesia is administered by a qualified anesthesiologist".',
    nl: '"Dr. Marciales removes excess skin and fat". In de veelgestelde vragen staat "Anesthesia is administered by a qualified anesthesiologist".',
    de: '"Dr. Marciales removes excess skin and fat". In den häufigen Fragen steht "Anesthesia is administered by a qualified anesthesiologist".' },
  'tummy-mexico|guerrero|arts': {
    en: 'The site names "Dr. Luis Eduardo Guerrero, Certified Plastic Surgeon" but does not say he operates himself. No anaesthesiologist is named.',
    nl: 'De site noemt "Dr. Luis Eduardo Guerrero, Certified Plastic Surgeon" maar zegt niet dat hij zelf opereert. Een anesthesioloog wordt niet genoemd.',
    de: 'Die Website nennt "Dr. Luis Eduardo Guerrero, Certified Plastic Surgeon", sagt aber nicht, dass er selbst operiert. Ein Anästhesist wird nicht genannt.' },
  'tummy-mexico|leyva|arts': {
    en: 'The site speaks of "a board certified Plastic Surgeon" without saying who performs the tummy tuck. No anaesthesiologist is named.',
    nl: 'De site spreekt van "a board certified Plastic Surgeon" zonder te zeggen wie de buikwandcorrectie doet. Een anesthesioloog wordt niet genoemd.',
    de: 'Die Website spricht von "a board certified Plastic Surgeon", ohne zu sagen, wer die Bauchdeckenstraffung durchführt. Ein Anästhesist wird nicht genannt.' },
  'tummy-mexico|mcc|prijs': {
    en: '"$7,800+ USD", a starting price for Mexico from the clinic\'s own comparison table.',
    nl: '"$7,800+ USD", een vanafprijs voor Mexico uit de eigen vergelijkingstabel van de kliniek.',
    de: '"$7,800+ USD", ein Einstiegspreis für Mexiko aus der eigenen Vergleichstabelle der Klinik.' },
  'tummy-mexico|moran|arts': {
    en: '"Dr. Mario Moran will remove excess skin, tighten the underlying muscles". No anaesthesiologist is named.',
    nl: '"Dr. Mario Moran will remove excess skin, tighten the underlying muscles". Een anesthesioloog wordt niet genoemd.',
    de: '"Dr. Mario Moran will remove excess skin, tighten the underlying muscles". Ein Anästhesist wird nicht genannt.' },
  'tummy-mexico|sigler|arts': {
    en: '"Your surgeon will remove the excess skin and fat". The site does not say explicitly that she operates herself, and no anaesthesiologist is named.',
    nl: '"Your surgeon will remove the excess skin and fat". Dat zij zelf opereert staat er niet uitdrukkelijk, en een anesthesioloog wordt niet genoemd.',
    de: '"Your surgeon will remove the excess skin and fat". Dass sie selbst operiert, steht nicht ausdrücklich da; ein Anästhesist wird nicht genannt.' },
  'tummy-mexico|lara|arts': {
    en: 'Written in the first person: "As a board-certified plastic surgeon, I offer" the procedure. An anaesthesiologist appears only in a patient story.',
    nl: 'Geschreven in de ik-vorm: "As a board-certified plastic surgeon, I offer" de ingreep. Een anesthesioloog komt alleen in een patiëntverhaal voor.',
    de: 'In der Ich-Form geschrieben: "As a board-certified plastic surgeon, I offer" den Eingriff. Ein Anästhesist kommt nur in einem Patientenbericht vor.' },
  'tummy-mexico|diaz|arts': {
    en: 'Posts appear under the name of Dr. Jorge L. Diaz Martinez, "Cirujano Plastico Certificado"; they do not say explicitly that he operates himself.',
    nl: 'Berichten staan op naam van Dr. Jorge L. Diaz Martinez, "Cirujano Plastico Certificado"; dat hij zelf opereert staat er niet uitdrukkelijk.',
    de: 'Beiträge erscheinen unter dem Namen von Dr. Jorge L. Diaz Martinez, "Cirujano Plastico Certificado"; dass er selbst operiert, steht nicht ausdrücklich da.' },
  'tummy-mexico|vive|prijs': {
    en: '$6,200, set against $14,500 in the US and Canada. The site does not say what the price includes.',
    nl: '$6.200, afgezet tegen $14.500 in de VS en Canada. De site zegt niet wat er in de prijs zit.',
    de: '6.200 Dollar, verglichen mit 14.500 Dollar in den USA und Kanada. Die Website sagt nicht, was im Preis enthalten ist.' },
  'tummy-mexico|vive|risico:0': {
    en: 'A US patient filed a complaint with the state health regulator COEPRIS Baja California about burns after a facial laser treatment (March 2026) at Vive Medical Spa Tijuana, where Félix Omar Márquez Villalobos is the responsible doctor. COEPRIS confirms the complaint is being handled and was referred for inspection; there is no ruling. RealSelf links Vive Medical Spa (with Márquez) to Vive Plastic Surgery. The complaint is not about a tummy tuck.',
    nl: 'Een Amerikaanse patiënt diende bij de gezondheidstoezichthouder COEPRIS Baja California een klacht in over brandplekken na een laserbehandeling van het gezicht (maart 2026) bij Vive Medical Spa Tijuana, waar Félix Omar Márquez Villalobos de verantwoordelijke arts is. COEPRIS bevestigt dat de klacht in behandeling is en naar inspectie is doorverwezen; er is geen uitspraak. RealSelf koppelt Vive Medical Spa (met Márquez) aan Vive Plastic Surgery. De klacht gaat niet over een buikwandcorrectie.',
    de: 'Ein US-Patient reichte bei der Gesundheitsaufsicht COEPRIS Baja California eine Beschwerde über Verbrennungen nach einer Laserbehandlung im Gesicht (März 2026) bei Vive Medical Spa Tijuana ein, wo Félix Omar Márquez Villalobos der verantwortliche Arzt ist. COEPRIS bestätigt, dass die Beschwerde bearbeitet und an die Inspektion weitergeleitet wurde; eine Entscheidung gibt es nicht. RealSelf verbindet Vive Medical Spa (mit Márquez) mit Vive Plastic Surgery. Die Beschwerde betrifft keine Bauchdeckenstraffung.' },
  'tummy-mexico|ciplastic|prijs': {
    en: 'The page says "Price starting at: $6,200 usd"; the FAQ on the same page says $5,600.',
    nl: 'Op de pagina staat "Price starting at: $6,200 usd"; in de veelgestelde vragen op dezelfde pagina staat $5.600.',
    de: 'Auf der Seite steht "Price starting at: $6,200 usd"; in den häufigen Fragen derselben Seite stehen 5.600 Dollar.' },
  'tummy-mexico|ciplastic|risico:0': {
    en: 'A patient reports complications after a breast reduction (January 2023) at Ciplastic by Dr. Hermes Ávila Pelayo. She filed a negligence complaint with the state prosecutor (FGE) and a complaint with the medical arbitration commission CAMEBC; mediation ended without agreement and the criminal complaint stalled. The surgeon disputes the account. There is no ruling.',
    nl: 'Een patiënte meldt complicaties na een borstverkleining (januari 2023) bij Ciplastic door Dr. Hermes Ávila Pelayo. Zij deed aangifte wegens nalatigheid bij het openbaar ministerie van de staat (FGE) en diende een klacht in bij de medische arbitragecommissie CAMEBC; de bemiddeling eindigde zonder akkoord en de aangifte lag stil. De chirurg betwist het verhaal. Er is geen uitspraak.',
    de: 'Eine Patientin berichtet von Komplikationen nach einer Brustverkleinerung (Januar 2023) bei Ciplastic durch Dr. Hermes Ávila Pelayo. Sie erstattete Anzeige wegen Fahrlässigkeit bei der Staatsanwaltschaft des Bundesstaats (FGE) und reichte eine Beschwerde bei der medizinischen Schlichtungsstelle CAMEBC ein; die Schlichtung endete ohne Einigung, die Anzeige ruhte. Der Chirurg bestreitet die Darstellung. Eine Entscheidung gibt es nicht.' },
  'tummy-mexico|mybestbody|prijs': {
    en: '"tummy tucks starting at just $5,500", an all-inclusive package with hotel, transport and medication.',
    nl: '"tummy tucks starting at just $5,500", een all-inclusive pakket met hotel, vervoer en medicatie.',
    de: '"tummy tucks starting at just $5,500", ein Komplettpaket mit Hotel, Transport und Medikamenten.' },
  'tummy-mexico|mybestbody|arts': {
    en: '"Dr. Castillo will then tighten your abdominal muscles". No anaesthesiologist is named.',
    nl: '"Dr. Castillo will then tighten your abdominal muscles". Een anesthesioloog wordt niet genoemd.',
    de: '"Dr. Castillo will then tighten your abdominal muscles". Ein Anästhesist wird nicht genannt.' },
  'tummy-mexico|gutierrez|arts': {
    en: 'The site says Dr. Gutiérrez "offers expertly performed tummy tuck procedures"; it does not say explicitly that he operates himself. No anaesthesiologist is named.',
    nl: 'De site zegt dat Dr. Gutiérrez "offers expertly performed tummy tuck procedures"; dat hij zelf opereert staat er niet uitdrukkelijk. Een anesthesioloog wordt niet genoemd.',
    de: 'Laut Website gilt: Dr. Gutiérrez "offers expertly performed tummy tuck procedures"; dass er selbst operiert, steht nicht ausdrücklich da. Ein Anästhesist wird nicht genannt.' },

  'plastic-colombia|premiumcare|prijs': {
    en: 'USD 5,800 to 6,200 all inclusive for a tummy tuck (an average, from an article dated 19 November 2025). This is not a price for a Brazilian butt lift.',
    nl: 'USD 5.800 tot 6.200 alles inbegrepen voor een buikwandcorrectie (een gemiddelde, uit een artikel van 19 november 2025). Dit is geen prijs voor een Brazilian butt lift.',
    de: '5.800 bis 6.200 US-Dollar alles inklusive für eine Bauchdeckenstraffung (ein Durchschnitt, aus einem Artikel vom 19. November 2025). Das ist kein Preis für einen Brazilian Butt Lift.' },
};

// Meldingen die een reviewplatform zelf bij een profiel zet.
export const WAARSCHUWING = {
  'Trustpilot removed fake reviews': { en: 'Trustpilot removed fake reviews from this profile', nl: 'Trustpilot heeft nepreviews van dit profiel verwijderd', de: 'Trustpilot hat gefälschte Bewertungen von diesem Profil entfernt' },
  'account suspended': { en: 'RealSelf suspended this account', nl: 'RealSelf heeft dit account geschorst', de: 'RealSelf hat dieses Konto gesperrt' },
};

// De conclusies in tsc-rank.json zijn geschreven bij de eerste rangmethode. Deze versies noemen geen plek in de ranglijst
// meer (de plek komt uit de review-index en verandert met de data).
export const CONCLUSIE = {
  'hair-turkey|smile': {
    en: 'About 4,800 reviews averaging 4.9, and clear published prices. The site says technicians do the implantation in the two cheaper packages; only the top package names the founding doctors. We found no ISHRS or ABHRS credential for its doctors.',
    nl: 'Zo\'n 4.800 reviews met gemiddeld 4,9, en duidelijke prijzen. De site zegt dat in de twee goedkopere pakketten technici de haren plaatsen; alleen het duurste pakket noemt de oprichtende artsen. Voor de artsen vonden we geen ISHRS- of ABHRS-kwalificatie.',
    de: 'Rund 4.800 Bewertungen mit durchschnittlich 4,9 und klare Preise. Laut Website setzen in den zwei günstigeren Paketen Techniker die Grafts ein; nur das teuerste Paket nennt die Gründerärzte. Für die Ärzte fanden wir keine ISHRS- oder ABHRS-Qualifikation.' },
  'hair-turkey|hlc': {
    en: 'Strong on qualifications, without public reviews: founder Dr. Özgür Öztan is an ISHRS Fellow and ABHRS diplomate, and four independent patient forums name the clinic. Its site says only surgeons operate, no assistants. No price published and no review profile found.',
    nl: 'Sterk op kwalificaties, zonder openbare reviews: oprichter Dr. Özgür Öztan is ISHRS-fellow en ABHRS-diplomate, en vier onafhankelijke patiëntenforums noemen de kliniek. De site zegt dat alleen chirurgen opereren, geen assistenten. Geen prijs en geen reviewprofiel gevonden.',
    de: 'Stark bei Qualifikationen, ohne öffentliche Bewertungen: Gründer Dr. Özgür Öztan ist ISHRS-Fellow und ABHRS-Diplomate, vier unabhängige Patientenforen nennen die Klinik. Laut Website operieren nur Chirurgen, keine Assistenten. Kein Preis und kein Bewertungsprofil gefunden.' },
  'hair-turkey|bicer': {
    en: 'Strong on qualifications: Dr. Özlem Biçer is an ISHRS Fellow and ABHRS diplomate, and independent forums recommend her. No review profile or price found.',
    nl: 'Sterk op kwalificaties: Dr. Özlem Biçer is ISHRS-fellow en ABHRS-diplomate, en onafhankelijke forums raden haar aan. Geen reviewprofiel of prijs gevonden.',
    de: 'Stark bei Qualifikationen: Dr. Özlem Biçer ist ISHRS-Fellow und ABHRS-Diplomate, unabhängige Foren empfehlen sie. Kein Bewertungsprofil und kein Preis gefunden.' },
  'hair-turkey|naturalhair': {
    en: '3.0 from 929 Trustpilot reviews, 19% of them one star. Low prices from EUR 1,600, but no surgeon is named.',
    nl: '3,0 uit 929 Trustpilot-reviews, waarvan 19% één ster. Lage prijzen vanaf EUR 1.600, maar geen chirurg genoemd.',
    de: '3,0 aus 929 Trustpilot-Bewertungen, davon 19% mit einem Stern. Niedrige Preise ab 1.600 Euro, aber kein Chirurg genannt.' },
  'hair-turkey|cinik': {
    en: 'About 8,700 reviews averaging 4.8, but a British patient died at the clinic in July 2025 before his operation; Turkish authorities are investigating. Technicians do the extraction; Dr. Cinik opens the channels only in the Signature package.',
    nl: 'Zo\'n 8.700 reviews met gemiddeld 4,8, maar in juli 2025 overleed een Britse patiënt in de kliniek voor zijn operatie; de Turkse autoriteiten onderzoeken het. Technici halen de haren weg; Dr. Cinik maakt de kanalen alleen in het Signature-pakket.',
    de: 'Rund 8.700 Bewertungen mit durchschnittlich 4,8, aber im Juli 2025 starb ein britischer Patient vor seiner Operation in der Klinik; die türkischen Behörden ermitteln. Techniker entnehmen die Grafts; Dr. Cinik öffnet die Kanäle nur im Signature-Paket.' },
  'tummy-mexico|marciales': {
    en: 'CMCPER, AMCPER and ASPS, and the site says he removes skin and fat himself. 41 RealSelf reviews.',
    nl: 'CMCPER, AMCPER en ASPS, en de site zegt dat hij huid en vet zelf weghaalt. 41 reviews op RealSelf.',
    de: 'CMCPER, AMCPER und ASPS, und die Website sagt, dass er Haut und Fett selbst entfernt. 41 Bewertungen auf RealSelf.' },
  'tummy-mexico|vida': {
    en: '535 reviews on the RealSelf practice profile, average 4.5. Lead surgeon Dr. Alejandro Quiroz is CMCPER certified, an AMCPER member and an international ASPS member. It publishes a price ($4,500 with surgeon, facility and anaesthesia), but the tummy tuck page does not say which surgeon operates.',
    nl: '535 reviews op het RealSelf-profiel van de praktijk, gemiddeld 4,5. Hoofdchirurg Dr. Alejandro Quiroz is gecertificeerd door CMCPER, lid van AMCPER en internationaal lid van ASPS. De prijs staat erbij ($4.500 met chirurg, operatiekamer en narcose), maar de pagina zegt niet welke chirurg opereert.',
    de: '535 Bewertungen auf dem RealSelf-Profil der Praxis, im Schnitt 4,5. Leitender Chirurg Dr. Alejandro Quiroz ist von CMCPER zertifiziert, AMCPER-Mitglied und internationales ASPS-Mitglied. Der Preis steht dabei (4.500 Dollar mit Chirurg, OP und Narkose), aber die Seite sagt nicht, welcher Chirurg operiert.' },
  'plastic-colombia|premiumcare': {
    en: '297 reviews on the RealSelf practice profile, average 4.8, the newest from August 2026. Dr. Alex Campbell is an international ASPS member. The practice publishes a price (USD 5,800 to 6,200 all inclusive for a tummy tuck) and has its own recovery suites. The site does not say which surgeon does which steps.',
    nl: '297 reviews op het RealSelf-profiel van de praktijk, gemiddeld 4,8, de nieuwste van augustus 2026. Dr. Alex Campbell is internationaal lid van ASPS. De praktijk heeft een prijs online (5.800 tot 6.200 dollar alles inbegrepen voor een buikwandcorrectie) en eigen herstelsuites. De site zegt niet welke chirurg welke stappen doet.',
    de: '297 Bewertungen auf dem RealSelf-Profil der Praxis, im Schnitt 4,8, die neueste vom August 2026. Dr. Alex Campbell ist internationales ASPS-Mitglied. Die Praxis veröffentlicht einen Preis (5.800 bis 6.200 Dollar alles inklusive für eine Bauchdeckenstraffung) und hat eigene Erholungssuiten. Wer welchen Schritt macht, sagt die Website nicht.' },
};

// Geeft de lezerstekst van een veld in de gevraagde taal, of '' als die er niet is.
export function veldTekst(listId, providerId, veld, language) {
  const entry = VELD[String(listId) + '|' + String(providerId).replace(/-doctor-\d+$/, '') + '|' + veld];
  return entry ? entry[language] || '' : '';
}
export const waarschuwingTekst = (raw, language) => (WAARSCHUWING[raw] || {})[language] || '';
export function conclusieTekst(listId, provider, language) {
  const override = CONCLUSIE[String(listId) + '|' + provider.id];
  return (override && override[language]) || (provider.conclusie && provider.conclusie[language]) || '';
}

// Aanbieders die bewust buiten de ranglijst staan (niet_gerangschikt in tsc-rank.json), per taal. Sleutel: de naam in de data.
export const BUITEN_RANGLIJST = {
  'Destination Beauty (Bangkok)': {
    en: 'A broker that arranges surgery trips, not a clinic; its Trustpilot reviews do not count for a surgeon.',
    nl: 'Een bemiddelaar die operatiereizen regelt, geen kliniek; de reviews op Trustpilot tellen niet voor een chirurg.',
    de: 'Ein Vermittler, der OP-Reisen organisiert, keine Klinik; die Trustpilot-Bewertungen zählen nicht für einen Chirurgen.' },
  'Longevita': {
    en: 'A broker, not a clinic: it says itself that it performs no procedures.',
    nl: 'Een bemiddelaar, geen kliniek: zegt zelf geen ingrepen uit te voeren.',
    de: 'Ein Vermittler, keine Klinik: führt nach eigener Aussage keine Eingriffe durch.' },
  'Art Siluette (Dr. Jesús Manuel Báez López)': {
    en: 'A patient died during surgery in 2021, and news reports say he is not trained as a plastic surgeon.',
    nl: 'In 2021 overleed een patiënt tijdens een operatie, en volgens nieuwsberichten is hij niet opgeleid als plastisch chirurg.',
    de: '2021 starb eine Patientin während einer Operation; laut Medienberichten ist er nicht als plastischer Chirurg ausgebildet.', incident: true },
  'Clínica Láser Surgical (Bogotá)': {
    en: 'The Colombian health supervisor Supersalud closed its plastic surgery service in June 2026.',
    nl: 'De Colombiaanse zorgtoezichthouder Supersalud sloot in juni 2026 de afdeling plastische chirurgie.',
    de: 'Die kolumbianische Gesundheitsaufsicht Supersalud schloss im Juni 2026 den Bereich plastische Chirurgie.', incident: true },
  'Clínica de Obesidad y Envejecimiento (Bogotá)': {
    en: 'Supersalud temporarily closed its plastic surgery service in May 2026 for operating without a licence.',
    nl: 'Supersalud sloot in mei 2026 tijdelijk de afdeling plastische chirurgie wegens werken zonder vergunning.',
    de: 'Supersalud schloss im Mai 2026 vorübergehend den Bereich plastische Chirurgie wegen Betriebs ohne Genehmigung.', incident: true },
  'Grand Plastic Surgery (Seoul)': {
    en: 'RealSelf shows its practice account as suspended, with no reviews.',
    nl: 'RealSelf toont het praktijkaccount als geschorst, zonder reviews.',
    de: 'RealSelf zeigt das Praxiskonto als gesperrt, ohne Bewertungen.' },
};

// Eén adres per aanbieder en taal. Een pagina bestaat alleen als er een geschreven conclusie in alle drie de talen is.
const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ß/g, 'ss').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const MAP = { en: { clinic: 'clinics', doctor: 'doctors' }, nl: { clinic: 'nl/klinieken', doctor: 'nl/artsen' }, de: { clinic: 'de/kliniken', doctor: 'de/aerzte' } };
export const heeftPagina = (listId, provider) => !!provider && !/-doctor-\d+$/.test(String(provider.id)) && ['en', 'nl', 'de'].every(language => conclusieTekst(listId, provider, language));
export const providerSlug = (provider, language = 'en') => MAP[language][provider.kind === 'doctor' ? 'doctor' : 'clinic'] + '/' + slugify(provider.naam);
