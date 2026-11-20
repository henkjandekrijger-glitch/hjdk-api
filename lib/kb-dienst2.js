// Beslisgids op kaufberater.best voor het AI-gat "wellness im hotel" (Demand Radar 19 nov 2026: 236.000 per maand, 3 van 3 andere AI's zonder eerste keus).
// Zelfde vorm als lib/kb-dienst.js (decisionKind 'dienst', lang 'de', met kostentabel), eigen bestand om botsingen met andere chats te vermijden.
// DIENST_DE in lib/kb-dienst.js leest DIENST_DE2. Henkjan 19 nov 2026: "Maak ze". Protocol: .claude/skills/keuzehulp-bouw/SKILL.md.
// Elk cijfer is gelezen op de genoemde bron op GELEZEN. Geen gedachtestreepjes, geen affiliate.

const GELEZEN = '2026-11-20';
const DISC = 'Wir bekommen von den genannten Anbietern kein Geld. Alle Links sind normale Links ohne Provision.';
const KMW = 'https://www.kurz-mal-weg.de/wellness-wochenende';
const VW = 'https://www.verwoehnwochenende.de/kurzurlaub/thema/wellness-urlaub-fuer_2-personen/seite/3';
const WH_DE = 'https://www.wellness-heaven.de/beste-wellnesshotels/deutschland/';
const WH_AW = 'https://www.wellness-heaven.de/wellness/awards-2027/';
const WH = 'https://www.wellness-heaven.de/';
const STEMP = 'https://www.das-stemp.de/files/downloads/pdf/Preisliste%202026-stemp-klein.pdf';
const TB_RELAX = 'https://www.travelbook.de/uebernachten/hotels/wellnesshotels-deutschland-1';
const RELAX_2024 = 'https://www.presseportal.de/download/document/6528eb3c270000fd2cff7b9d-1089581443.pdf';

const WELLNESS = {
  slug: 'wellnesshotel-buchen-wochenende-day-spa-kosten', lang: 'de', decisionKind: 'dienst', priority: 80, cat: 'Gesundheit & Beauty', term: 'wellness im hotel',
  title: 'Wellnesshotel buchen: Wochenende, Day Spa und was es kostet',
  h1: 'Wellness im Hotel: wo buchen und was es kostet',
  seoTitle: 'Wellnesshotel buchen: Wochenende, Day Spa und was es kostet',
  metaDesc: 'Wellness im Hotel: 2 Nächte im Arrangement ab 116 € pro Person, Day Spa ab 125 €. Erst das Testurteil prüfen, dann buchen. Mit Beispielen und Quellen.',
  intro: 'Wellnesshotel, Arrangement oder nur ein Tag im Spa? Was du suchst, entscheidet, wo du am besten buchst und was es kostet.',
  kort: 'Für ein Wellness-Wochenende ist ein Arrangement die erste Wahl: Auf kurz-mal-weg.de kosteten 3 Tage mit 2 Nächten inklusive Therme am 20. November 2026 ab 116 € pro Person, kostenlos stornierbar. Soll es ein Spitzenhaus sein, prüfe zuerst das Testurteil: Wellness Heaven führt 164 getestete Wellnesshotels in Deutschland und nimmt nur Häuser ab 8,0 Sternen auf, der Relax Guide vergibt bis zu vier Lilien. Nur ein Tag frei? Viele Wellnesshotels bieten Day Spa ohne Übernachtung, im Wellnessresort Das Stemp 2026 ab 125 € pro Person.',
  questions: [
    { q: 'Was suchst du?', options: [{ label: 'Wellness-Wochenende für zwei' }, { label: 'Bestes Wellnesshotel in Deutschland' }, { label: 'Day Spa ohne Übernachtung' }, { label: 'Wellness-Gutschein verschenken' }] },
    { q: 'Wer kommt mit?', options: [{ label: 'Zu zweit' }, { label: 'Allein' }, { label: 'Mit Freundinnen oder Familie' }] },
    { q: 'Wie viel willst du ausgeben?', options: [{ label: 'Bis 150 € pro Person' }, { label: '150 bis 400 € pro Person' }, { label: 'Mehr als 400 € pro Person' }] }
  ],
  routes: [
    { title: 'Wellness-Wochenende: ein Arrangement zum Festpreis', why: 'Ein Arrangement bündelt Zimmer, Frühstück und den Wellnessbereich zu einem Preis. Auf kurz-mal-weg.de kosteten 3 Tage mit 2 Nächten inklusive Therme am 20. November 2026 ab 116 € pro Person (Gesamtpreis 231 €). Ein Stadthotel in Bad Salzuflen kostete dort 230 € gesamt, mit täglichem Sektfrühstück, Wellness-Oase und Sauna. Auf verwoehnwochenende.de standen 327 Angebote für ein Wellness-Wochenende zu zweit.', note: 'Lies die Inklusivleistungen: Nicht jedes Angebot enthält eine Massage oder das Abendessen. Das Beispiel für 116 € war kostenlos stornierbar.', tradeoff: 'Der niedrigste Preis gilt nicht an jedem Termin, und Anwendungen wie Massagen sind nicht immer enthalten.', links: [['Angebote auf kurz-mal-weg.de', KMW], ['Angebote auf verwoehnwochenende.de', VW]] },
    { title: 'Spitzenhotel: erst das Testurteil, dann buchen', why: 'Wellness Heaven testet Hotels seit 2006 persönlich nach mehr als 500 Kriterien und nimmt nur Häuser ab 8,0 Sternen auf. Für Deutschland sind 164 Wellnesshotels gelistet, und 8 der 25 Auszeichnungen der Awards 2027 gingen an deutsche Hotels. Der Relax Guide schickt anonyme Tester und vergibt bis zu vier Lilien. Die Höchstnote gibt es ab 19 von 20 Punkten.', note: 'Vergleiche danach den Preis auf der Website des Hotels mit dem Preis im Portal und frage, was im Zimmerpreis enthalten ist.', tradeoff: 'Häuser mit Höchstnote kosten deutlich mehr als ein Arrangement im Mittelklassehotel.', links: [['Beste Wellnesshotels bei Wellness Heaven', WH_DE], ['Wellness Heaven Awards 2027', WH_AW]] },
    { title: 'Nur ein Tag: Day Spa im Wellnesshotel', why: 'Viele Wellnesshotels lassen Tagesgäste in den Spa. Ein Beispiel mit öffentlicher Preisliste: Im Wellnessresort Das Stemp kostet der Day Spa 2026 je nach Paket 125 €, 159 € oder 196 € pro Person, von 8 bis 21 Uhr. Das Paket für zwei kostet 378 €.', note: 'Laut Preisliste fällt dort am Wochenende und an Feiertagen ein Zuschlag von 15 € pro Person an. Reserviere vorher.', tradeoff: 'Du sparst die Übernachtung, hast aber An- und Abreise am selben Tag.', links: [['Preisliste Das Stemp 2026 (PDF)', STEMP], ['Day-Spa-Angebote auf verwoehnwochenende.de', VW]] },
    { title: 'Verschenken: ein Gutschein für ein Arrangement', why: 'Auf kurz-mal-weg.de gibt es Arrangements auch als Gutschein. So legst du Hotel und Leistungen fest, und die Beschenkten wählen den Termin.', note: 'Prüfe vor dem Kauf, wie lange der Gutschein gilt und an welchen Tagen er einlösbar ist.', tradeoff: 'Ein Gutschein für ein bestimmtes Hotel ist weniger flexibel als ein Wertgutschein.', links: [['Wellness-Wochenende als Gutschein', KMW]] }
  ],
  extra2: ['Zu zweit: Bei Arrangements für zwei steht der Gesamtpreis direkt dabei.', 'Allein unterwegs: Frage nach dem Preis für ein Einzelzimmer, oder nimm einen Day Spa.', 'Für eine Gruppe am besten direkt beim Hotel anfragen.'],
  extra3: ['Bis 150 € pro Person passt ein Arrangement mit 2 Nächten ab 116 € oder ein Day Spa ab 125 €.', 'In dieser Spanne lohnt der Vergleich der Inklusivleistungen: Abendessen und Anwendungen machen den Unterschied.', 'Über 400 € pro Person bist du bei den ausgezeichneten Häusern. Prüfe das Testurteil bei Wellness Heaven oder im Relax Guide.'],
  picks: [
    ['Wellness-Wochenende für zwei', 'Arrangement auf einem Kurzreise-Portal', '3 Tage mit 2 Nächten inklusive Therme ab 116 € pro Person, Gesamtpreis 231 €.'],
    ['Bestes Wellnesshotel in Deutschland', 'Ein Haus mit Testurteil von Wellness Heaven oder Relax Guide', '164 getestete Hotels bei Wellness Heaven, bis zu vier Lilien im Relax Guide.'],
    ['Day Spa ohne Übernachtung', 'Day Spa im Wellnesshotel', 'Beispiel Das Stemp 2026: 125 € bis 196 € pro Person, 8 bis 21 Uhr.'],
    ['Wellness-Gutschein verschenken', 'Gutschein für ein Arrangement', 'Hotel und Leistungen stehen fest, der Termin bleibt offen.']
  ],
  tabel: { kop: 'Was Wellness im Hotel kostet: Beispiele', cols: ['Angebot', 'Preis', 'Quelle'], rows: [
    ['3 Tage, 2 Nächte, inklusive Therme', 'ab 116 € pro Person, 231 € gesamt', 'kurz-mal-weg.de, 20. November 2026'],
    ['3 Tage, 2 Nächte, Sektfrühstück, Wellness-Oase und Sauna (Bad Salzuflen)', '230 € gesamt', 'kurz-mal-weg.de, 20. November 2026'],
    ['Day Spa, 8 bis 21 Uhr', '125 €, 159 € oder 196 € pro Person', 'Das Stemp, Preisliste 2026'],
    ['Day Spa für zwei', '378 € für 2 Personen', 'Das Stemp, Preisliste 2026'],
    ['Zuschlag am Wochenende und an Feiertagen', '15 € pro Person', 'Das Stemp, Preisliste 2026']
  ], noot: 'Die Preise sind Beispiele vom Lesetag und hängen vom Termin ab.' },
  guide: 'Was ein Wellness-Wochenende kostet. Auf kurz-mal-weg.de standen am 20. November 2026 Arrangements mit 3 Tagen und 2 Nächten inklusive Therme ab 116 € pro Person, Gesamtpreis 231 €. Ein weiteres Beispiel dort: 230 € gesamt in Bad Salzuflen, mit täglichem Sektfrühstück, Wellness-Oase und Sauna.\nWie die Tests arbeiten. Wellness Heaven testet seit 2006 persönlich, nach mehr als 500 Kriterien, und führt nur Hotels ab 8,0 Sternen. Bei den Awards 2027 vom 5. Oktober 2026 stimmten Gäste mit 108.613 Stimmen ab, 102 Hotels waren nominiert. Der Relax Guide arbeitet mit anonymen Testern und vergibt bis zu vier Lilien. Vier Lilien gibt es ab 19 von 20 Punkten. Der Relax Guide 2024 zählte 158 Lilien-Hotels in Deutschland.\nDay Spa. Wer nicht übernachten will, bucht einen Tag im Spa eines Wellnesshotels. Das Stemp nennt für 2026 Pakete zu 125 €, 159 € und 196 € pro Person, jeweils von 8 bis 21 Uhr.\nWorauf du achtest. Vergleiche, was im Preis steckt: Frühstück, Abendessen, Zugang zu Sauna und Pool, Anwendungen. Prüfe die Stornobedingungen, bevor du zahlst.',
  mistakes: ['Nur den Preis vergleichen und die Inklusivleistungen übersehen.', 'Ein Hotel Wellnesshotel nennen lassen, ohne ein Testurteil zu prüfen.', 'Für einen einzelnen Tag eine Übernachtung buchen, obwohl das Hotel Day Spa anbietet.', 'Einen Gutschein kaufen, ohne die Gültigkeit und die einlösbaren Tage zu lesen.'],
  aiMiss: ['KI-Antworten nennen Hotelketten und Buchungsportale ohne erste Wahl. Für ein Wochenende ist das Arrangement der einfachste Weg: 2 Nächte inklusive Therme ab 116 € pro Person.', 'Die Antworten nennen selten die unabhängigen Tests: Wellness Heaven mit 164 getesteten Hotels in Deutschland und der Relax Guide mit seinen Lilien.', 'Day Spa ohne Übernachtung fehlt fast immer, obwohl viele Wellnesshotels Tagesgäste aufnehmen.'],
  faq: [
    { q: 'Welches Wellnesshotel soll ich buchen und wo buche ich am besten?', a: 'Für ein Wochenende ist ein Arrangement die erste Wahl: Auf kurz-mal-weg.de kosteten 3 Tage mit 2 Nächten inklusive Therme am 20. November 2026 ab 116 € pro Person. Soll es ein Spitzenhaus sein, prüfe zuerst das Testurteil bei Wellness Heaven (164 getestete Hotels in Deutschland, nur ab 8,0 Sternen) oder im Relax Guide (bis zu vier Lilien). Für einen einzelnen Tag reicht ein Day Spa, zum Beispiel im Wellnessresort Das Stemp ab 125 € pro Person.' },
    { q: 'Was kostet ein Wellness-Wochenende im Hotel?', a: 'Am 20. November 2026 gab es auf kurz-mal-weg.de Arrangements mit 3 Tagen und 2 Nächten inklusive Therme ab 116 € pro Person, Gesamtpreis 231 €. Ausgezeichnete Häuser kosten mehr.' },
    { q: 'Was kostet ein Day Spa im Hotel?', a: 'Im Wellnessresort Das Stemp kostet der Day Spa 2026 je nach Paket 125 €, 159 € oder 196 € pro Person, von 8 bis 21 Uhr. Am Wochenende und an Feiertagen kommen laut Preisliste 15 € pro Person dazu.' },
    { q: 'Woran erkenne ich ein gutes Wellnesshotel?', a: 'An einem unabhängigen Testurteil. Wellness Heaven testet nach mehr als 500 Kriterien und führt nur Hotels ab 8,0 Sternen. Der Relax Guide vergibt bis zu vier Lilien, die Höchstnote ab 19 von 20 Punkten.' },
    { q: 'Was bedeuten die Lilien im Relax Guide?', a: 'Die Lilien sind die Bewertung der anonymen Tester. Ein Hotel kann bis zu vier Lilien bekommen. Vier Lilien gibt es ab 19 von 20 Punkten.' },
    { q: 'Kann ich Wellness im Hotel ohne Übernachtung buchen?', a: 'Ja, viele Wellnesshotels bieten Day Spa für Tagesgäste. Auch Kurzreise-Portale wie verwoehnwochenende.de führen Angebote mit Day Spa ohne Übernachtung.' },
    { q: 'Gibt es Wellness-Wochenenden als Gutschein?', a: 'Ja. Auf kurz-mal-weg.de lassen sich Arrangements auch als Gutschein kaufen. Prüfe die Gültigkeit und die einlösbaren Tage.' }
  ],
  sources: [
    ['kurz-mal-weg.de: Wellness-Wochenende (Preise, Inklusivleistungen, Storno)', KMW],
    ['verwoehnwochenende.de: Wellness-Wochenende für zwei (327 Angebote, Day Spa)', VW],
    ['Wellness Heaven: beste Wellnesshotels in Deutschland 2027', WH_DE],
    ['Wellness Heaven: Awards 2027 (5. Oktober 2026)', WH_AW],
    ['Wellness Heaven: Startseite (Mindestbewertung 8,0 Sterne)', WH],
    ['Das Stemp: Preisliste 2026 (Day Spa)', STEMP],
    ['Travelbook: beste Wellnesshotels laut Relax Guide (Lilien und Punkte)', TB_RELAX],
    ['Relax Guide 2024: Vorwort (158 Lilien-Hotels in Deutschland)', RELAX_2024]
  ],
  disc: DISC,
  gelezen: GELEZEN, publishAt: '2026-11-20', updatedAt: '2026-11-20'
};

export const DIENST_DE2 = [WELLNESS];
