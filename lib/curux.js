// Bedrijfspagina's van curacao.day: strak en lerend op interactie (Henkjan 14 nov 2026, bij /en/businesses/grocery-store/waterloo-minimarket:
// "Deze paginas moeten echt veel veel strakker ... doe ook echt UX asessment" en "Maak de pagina helemaal lerend op interactiviteit .").
// - Opmaak: één kaart bovenaan (open nu, score, korte plek, knoppen), dan één feitenblok (tijden op één regel, telefoon leesbaar, adres zonder
//   Plus Code), dan sterren, vraag en ochtendmail, dan zaken dichtbij met afstand. Geen nullen, geen dubbele blokken.
// - Leren: Clickmind-proef 'curbedrijf' (lib/proef.js): elke bezoeker krijgt per onderdeel een versie (Thompson sampling, 10 tot 30% verkennen),
//   de waarde per bezoeker is zijn sterkste tik (bellen, WhatsApp, route, website, vraag, sterren, ander bedrijf). Stand:
//   /api/mm/proefstand?site=curbedrijf&vorm=tekst. Daarnaast per blok hoe vaak erin getikt wordt (cur:t:<dag>:bz-<blok>, ?op=uxstand).
// - De nachtronde (CLAUDE.md, sectie bedrijfspagina's) draait scripts/ux-bedrijf.mjs, repareert wat faalt, maakt een winnaar standaard en zet
//   de volgende uitdager uit data/cur/ux-uitdagers.json erbij.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const UXT = {
  nl: { uren: 'Open', alle: 'Elke dag', tel: 'Telefoon', adres: 'Adres', site: 'Website', prijs: 'Prijs', dichtbij: c => c + ' in de buurt', best: c => 'Best beoordeeld: ' + c.toLowerCase(), alle2: (c, n) => 'Alle ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 review op Google' : n + ' reviews op Google', vanaf: 'van hier', qUren: n => 'Wanneer is ' + n + ' open?', qTel: n => 'Wat is het nummer van ' + n + '?', qWaar: n => 'Waar zit ' + n + '?', qBuurt: c => 'Welke ' + c.toLowerCase() + ' zijn in de buurt?', qBest: c => 'Welke ' + c.toLowerCase() + ' scoren het best?', aRoute: 'Tik op Route voor de weg erheen.', chatKop: n => 'Vraag over ' + n, chatPh: 'Typ je vraag…', eig: 'Is dit jouw zaak? Claim deze pagina gratis', ster: 'Was je er?', qZon: 'Open op zondag?', aZonJa: 'Ja, op zondag ', aZonNee: 'Nee, op zondag gesloten.', qScore: n => 'Hoe beoordelen mensen ' + n + '?', qSite: n => 'Heeft ' + n + ' een website?', gKop: l => 'Vraag over ' + l.toLowerCase() + ' op Curaçao', qBeste: 'Welke scoort het best?', qGoedkoop: 'Welke is het goedkoopst?', qPlus: n => 'Plus- en minpunten van ' + n + '?', aGoed: 'Goed: ', aMin: 'Minder: ', qVgl: n => 'Hoe scoort ' + n + ' in de vergelijking?', aVgl: (p, n, top) => 'Plek ' + p + ' van ' + n + ' in onze vergelijking.' + (top ? ' Best beoordeeld: ' + top + '.' : ''), qZonC: c => 'Welke ' + c.toLowerCase() + ' zijn op zondag open?', ook: 'Vergelijk met', heel: 'Bekijk de hele vergelijking', qNuOpen: 'Welke is nu open?', aNuOpen: (t, l) => 'Om ' + t + ' open: ' + l + '.', totT: 'tot', qDicht: 'Welke zit het dichtst bij Willemstad?', qMeeste: 'Welke heeft de meeste reviews?' },
  en: { uren: 'Hours', alle: 'Every day', tel: 'Phone', adres: 'Address', site: 'Website', prijs: 'Price', dichtbij: c => c + ' nearby', best: c => 'Top rated ' + c.toLowerCase(), alle2: (c, n) => 'All ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 Google review' : n + ' Google reviews', vanaf: 'away', qUren: n => 'When is ' + n + ' open?', qTel: n => 'What is the phone number of ' + n + '?', qWaar: n => 'Where is ' + n + '?', qBuurt: c => 'Which ' + c.toLowerCase() + ' are nearby?', qBest: c => 'Which ' + c.toLowerCase() + ' are rated best?', aRoute: 'Tap Directions for the route.', chatKop: n => 'Ask about ' + n, chatPh: 'Type your question…', eig: 'Is this your business? Claim this page for free', ster: 'Been there?', qZon: 'Open on Sunday?', aZonJa: 'Yes, on Sunday ', aZonNee: 'No, closed on Sunday.', qScore: n => 'How do people rate ' + n + '?', qSite: n => 'Does ' + n + ' have a website?', gKop: l => 'Ask about ' + l.toLowerCase() + ' on Curaçao', qBeste: 'Which one is rated best?', qGoedkoop: 'Which one is cheapest?', qPlus: n => 'Pros and cons of ' + n + '?', aGoed: 'Good: ', aMin: 'Less good: ', qVgl: n => 'How does ' + n + ' compare?', aVgl: (p, n, top) => 'No. ' + p + ' of ' + n + ' in our comparison.' + (top ? ' Best rated: ' + top + '.' : ''), qZonC: c => 'Which ' + c.toLowerCase() + ' are open on Sunday?', ook: 'Compare with', heel: 'See the full comparison', qNuOpen: 'Which one is open now?', aNuOpen: (t, l) => 'Open at ' + t + ': ' + l + '.', totT: 'until', qDicht: 'Which one is closest to Willemstad?', qMeeste: 'Which one has the most reviews?' },
  de: { uren: 'Geöffnet', alle: 'Täglich', tel: 'Telefon', adres: 'Adresse', site: 'Website', prijs: 'Preis', dichtbij: c => c + ' in der Nähe', best: c => 'Am besten bewertet: ' + c, alle2: (c, n) => 'Alle ' + n + ' ' + c + ' →', google: n => n === 1 ? '1 Google-Bewertung' : n + ' Google-Bewertungen', vanaf: 'entfernt', qUren: n => 'Wann hat ' + n + ' geöffnet?', qTel: n => 'Wie ist die Nummer von ' + n + '?', qWaar: n => 'Wo ist ' + n + '?', qBuurt: c => 'Welche ' + c + ' gibt es in der Nähe?', qBest: c => 'Welche ' + c + ' sind am besten bewertet?', aRoute: 'Tippe auf Route für den Weg.', chatKop: n => 'Frag zu ' + n, chatPh: 'Deine Frage…', eig: 'Ist das dein Unternehmen? Übernimm diese Seite kostenlos', ster: 'Warst du dort?', qZon: 'Sonntags geöffnet?', aZonJa: 'Ja, sonntags ', aZonNee: 'Nein, sonntags geschlossen.', qScore: n => 'Wie wird ' + n + ' bewertet?', qSite: n => 'Hat ' + n + ' eine Website?', gKop: l => 'Frag zu ' + l + ' auf Curaçao', qBeste: 'Welcher ist am besten bewertet?', qGoedkoop: 'Welcher ist am günstigsten?', qPlus: n => 'Vor- und Nachteile von ' + n + '?', aGoed: 'Gut: ', aMin: 'Weniger gut: ', qVgl: n => 'Wie schneidet ' + n + ' im Vergleich ab?', aVgl: (p, n, top) => 'Platz ' + p + ' von ' + n + ' in unserem Vergleich.' + (top ? ' Am besten bewertet: ' + top + '.' : ''), qZonC: c => 'Welche ' + c + ' haben sonntags geöffnet?', ook: 'Vergleiche mit', heel: 'Ganzen Vergleich ansehen', qNuOpen: 'Welcher hat jetzt geöffnet?', aNuOpen: (t, l) => 'Um ' + t + ' geöffnet: ' + l + '.', totT: 'bis', qDicht: 'Welcher liegt am nächsten an Willemstad?', qMeeste: 'Welcher hat die meisten Bewertungen?' },
  es: { uren: 'Horario', alle: 'Todos los días', tel: 'Teléfono', adres: 'Dirección', site: 'Sitio web', prijs: 'Precio', dichtbij: c => c + ' cerca', best: c => 'Mejor valorados: ' + c.toLowerCase(), alle2: (c, n) => 'Los ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 reseña en Google' : n + ' reseñas en Google', vanaf: 'de aquí', qUren: n => '¿Cuándo abre ' + n + '?', qTel: n => '¿Cuál es el teléfono de ' + n + '?', qWaar: n => '¿Dónde está ' + n + '?', qBuurt: c => '¿Qué ' + c.toLowerCase() + ' hay cerca?', qBest: c => '¿Qué ' + c.toLowerCase() + ' tienen mejor nota?', aRoute: 'Toca Cómo llegar para la ruta.', chatKop: n => 'Pregunta sobre ' + n, chatPh: 'Escribe tu pregunta…', eig: '¿Es tu negocio? Reclama esta página gratis', ster: '¿Has estado?', qZon: '¿Abre el domingo?', aZonJa: 'Sí, el domingo ', aZonNee: 'No, el domingo está cerrado.', qScore: n => '¿Qué opinan de ' + n + '?', qSite: n => '¿' + n + ' tiene sitio web?', gKop: l => 'Pregunta sobre ' + l.toLowerCase() + ' en Curazao', qBeste: '¿Cuál tiene mejor nota?', qGoedkoop: '¿Cuál es el más barato?', qPlus: n => '¿Ventajas y desventajas de ' + n + '?', aGoed: 'Bien: ', aMin: 'Menos bien: ', qVgl: n => '¿Cómo queda ' + n + ' en la comparativa?', aVgl: (p, n, top) => 'Puesto ' + p + ' de ' + n + ' en nuestra comparativa.' + (top ? ' Mejor valorados: ' + top + '.' : ''), qZonC: c => '¿Qué ' + c.toLowerCase() + ' abren el domingo?', ook: 'Compara con', heel: 'Ver la comparativa completa', qNuOpen: '¿Cuál está abierto ahora?', aNuOpen: (t, l) => 'Abierto a las ' + t + ': ' + l + '.', totT: 'hasta las', qDicht: '¿Cuál está más cerca de Willemstad?', qMeeste: '¿Cuál tiene más reseñas?' },
  pt: { uren: 'Horário', alle: 'Todos os dias', tel: 'Telefone', adres: 'Endereço', site: 'Site', prijs: 'Preço', dichtbij: c => c + ' por perto', best: c => 'Mais bem avaliados: ' + c.toLowerCase(), alle2: (c, n) => 'Todos os ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 avaliação no Google' : n + ' avaliações no Google', vanaf: 'daqui', qUren: n => 'Quando ' + n + ' abre?', qTel: n => 'Qual é o telefone de ' + n + '?', qWaar: n => 'Onde fica ' + n + '?', qBuurt: c => 'Quais ' + c.toLowerCase() + ' ficam perto?', qBest: c => 'Quais ' + c.toLowerCase() + ' têm melhor nota?', aRoute: 'Toque em Como chegar para a rota.', chatKop: n => 'Pergunte sobre ' + n, chatPh: 'Escreva sua pergunta…', eig: 'É o seu negócio? Reivindique esta página grátis', ster: 'Já esteve lá?', qZon: 'Abre no domingo?', aZonJa: 'Sim, no domingo ', aZonNee: 'Não, fecha aos domingos.', qScore: n => 'Como avaliam ' + n + '?', qSite: n => n + ' tem site?', gKop: l => 'Pergunte sobre ' + l.toLowerCase() + ' em Curaçao', qBeste: 'Qual tem a melhor nota?', qGoedkoop: 'Qual é o mais barato?', qPlus: n => 'Prós e contras de ' + n + '?', aGoed: 'Bom: ', aMin: 'Menos bom: ', qVgl: n => 'Como ' + n + ' fica na comparação?', aVgl: (p, n, top) => 'Posição ' + p + ' de ' + n + ' na nossa comparação.' + (top ? ' Mais bem avaliados: ' + top + '.' : ''), qZonC: c => 'Quais ' + c.toLowerCase() + ' abrem no domingo?', ook: 'Compare com', heel: 'Ver a comparação completa', qNuOpen: 'Qual está aberto agora?', aNuOpen: (t, l) => 'Aberto às ' + t + ': ' + l + '.', totT: 'até', qDicht: 'Qual fica mais perto de Willemstad?', qMeeste: 'Qual tem mais avaliações?' },
};

// Een voorbeeldvraag in de chat staat er alleen als de data het antwoord heeft (Henkjan 17 nov 2026, bij de fastfoodgids: de chat bood "What is on
// the menu at The Flakos Grill" aan en antwoordde "We could not find a menu": "dit kan natuurlijk niet"). Zelfde regel als faqVragen met
// FAQ_SLEUTEL op de bedrijfspagina's. Een FAQ-antwoord waarvan de eerste zin zegt dat we het niet weten telt niet als antwoord: die vraag komt niet
// in de chat; de gids vult aan met vragen die altijd een antwoord uit de gegevens hebben (cur.js renderOnderwerp).
const GEEN_ANTW = /(niet (kunnen |hebben )?(terug)?vinden|niet gevonden|weten we niet|is (ons )?niet bekend|could ?n[o']t find|did not find|do not know|don't know|nicht gefunden|nicht finden|wissen wir nicht|no (hemos )?(podido )?encontra(do|mos|r)|no sabemos|n[aã]o encontramos|n[aã]o (conseguimos|sabemos))/i;
export const geenAntw = a => { const z = String(a || '').trim().split(/(?<=[.!?])\s/)[0] || ''; return !z || GEEN_ANTW.test(z); };

// "535V+4RQ, Kaya Seru Largu, Willemstad, Curaçao" → "Kaya Seru Largu, Willemstad"; naam vooraan en land achteraan weg
export function adresKort(x) {
  let a = String(x.adres || '').trim();
  a = a.replace(/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\s*,?\s*/i, '');
  const n = String(x.naam || '').trim(); if (n && a.toLowerCase().startsWith(n.toLowerCase())) a = a.slice(n.length).replace(/^\s*,\s*/, '');
  a = a.replace(/,\s*(Curaçao|Curacao|Curazao|Kòrsou)\s*$/i, '').trim();
  return a || String(x.plaats || '').trim();
}
// +59997384660 → +599 9 738 4660 (Curaçao); andere nummers zoals ze zijn
// FAQ-vragen per soort zaak (Henkjan 14 nov 2026: "En chat bedoel ik niet dom invullen bedrijfsgegevens maar context aware maken omdat je bij
// bedrijven zit dus context van die pagina een beetje faq achtig ."): drie vragen die iemand bij dit soort zaak echt heeft; een tik stelt de
// vraag aan de chat met de pagina als context (beschrijving, tijden, adres, reviews, buurt), de chat zegt eerlijk als het er niet staat.
export function faqGroep(cs) {
  const s = String(cs || '').toLowerCase();
  if (/car-rental|car-hire|rent-a-car|taxi|scooter|bike|bicycle|transport|bus-|shuttle|limousine/.test(s)) return 'vervoer';
  if (/rental-agency|villa|hotel|resort|apartment|accommodation|guest|lodg|bed-and|hostel|cabin|vacation|cottage|bungalow|holiday|inn\b|motel/.test(s)) return 'verblijf';
  if (/restaurant|cafe|coffee|bar\b|-bar|bakery|food|pizz|grill|snack|ice-cream|dessert|brunch|lunch|diner|sushi|steak|bistro|eatery|takeaway|truck/.test(s)) return 'eten';
  if (/dentist|doctor|clinic|hospital|physio|health|medical|pharmac|optic|veterin|vet\b/.test(s)) return 'zorg';
  if (/tour|div|snorkel|boat|charter|fitness|gym|yoga|surf|kite|golf|spa|beach|attraction|museum|park|zoo|aquarium|sport|dance|club/.test(s)) return 'actief';
  if (/store|shop|market|mall|boutique|grocery|jewel|cloth|liquor|hardware|electronic|book|gift|souvenir|florist/.test(s)) return 'winkel';
  return 'dienst';
}
export const FAQ = {
  nl: { verblijf: ['Hoeveel gasten kunnen er bij {n} logeren?', 'Hoe ver is {n} van het strand?', 'Heeft {n} een zwembad?'], eten: ['Wat staat er op de kaart bij {n}?', 'Moet ik reserveren bij {n}?', 'Is {n} geschikt voor kinderen?'], winkel: ['Wat kan ik kopen bij {n}?', 'Kan ik pinnen bij {n}?', 'Is er parkeerplek bij {n}?'], vervoer: ['Wat kost huren bij {n}?', 'Kan ik ophalen op het vliegveld?', 'Wat heb ik nodig om te huren bij {n}?'], actief: ['Wat kun je doen bij {n}?', 'Hoe lang duurt het?', 'Moet ik vooraf boeken bij {n}?'], zorg: ['Heb ik een afspraak nodig bij {n}?', 'Spreken ze Nederlands of Engels bij {n}?', 'Werkt {n} met mijn verzekering?'], dienst: ['Wat biedt {n} aan?', 'Heb ik een afspraak nodig bij {n}?', 'Welke talen spreken ze bij {n}?'] },
  en: { verblijf: ['How many guests can stay at {n}?', 'How far is {n} from the beach?', 'Does {n} have a pool?'], eten: ['What is on the menu at {n}?', 'Do I need to book at {n}?', 'Is {n} good with kids?'], winkel: ['What can I buy at {n}?', 'Can I pay by card at {n}?', 'Is there parking at {n}?'], vervoer: ['What does renting at {n} cost?', 'Can I pick up at the airport?', 'What do I need to rent at {n}?'], actief: ['What can you do at {n}?', 'How long does it take?', 'Do I need to book {n} ahead?'], zorg: ['Do I need an appointment at {n}?', 'Do they speak English at {n}?', 'Does {n} work with my insurance?'], dienst: ['What does {n} offer?', 'Do I need an appointment at {n}?', 'Which languages do they speak at {n}?'] },
  de: { verblijf: ['Wie viele Gäste passen in {n}?', 'Wie weit ist {n} vom Strand?', 'Hat {n} einen Pool?'], eten: ['Was steht bei {n} auf der Karte?', 'Muss ich bei {n} reservieren?', 'Ist {n} kinderfreundlich?'], winkel: ['Was kann ich bei {n} kaufen?', 'Kann ich bei {n} mit Karte zahlen?', 'Gibt es bei {n} Parkplätze?'], vervoer: ['Was kostet die Miete bei {n}?', 'Kann ich am Flughafen abholen?', 'Was brauche ich zum Mieten bei {n}?'], actief: ['Was kann man bei {n} machen?', 'Wie lange dauert es?', 'Muss ich {n} vorher buchen?'], zorg: ['Brauche ich bei {n} einen Termin?', 'Spricht man bei {n} Deutsch oder Englisch?', 'Arbeitet {n} mit meiner Versicherung?'], dienst: ['Was bietet {n} an?', 'Brauche ich bei {n} einen Termin?', 'Welche Sprachen spricht man bei {n}?'] },
  es: { verblijf: ['¿Cuántos huéspedes caben en {n}?', '¿A qué distancia está {n} de la playa?', '¿Tiene piscina {n}?'], eten: ['¿Qué hay en la carta de {n}?', '¿Hay que reservar en {n}?', '¿Es {n} bueno para niños?'], winkel: ['¿Qué puedo comprar en {n}?', '¿Puedo pagar con tarjeta en {n}?', '¿Hay estacionamiento en {n}?'], vervoer: ['¿Cuánto cuesta alquilar en {n}?', '¿Puedo recogerlo en el aeropuerto?', '¿Qué necesito para alquilar en {n}?'], actief: ['¿Qué se puede hacer en {n}?', '¿Cuánto dura?', '¿Hay que reservar {n} con antelación?'], zorg: ['¿Necesito cita en {n}?', '¿Hablan español o inglés en {n}?', '¿Trabaja {n} con mi seguro?'], dienst: ['¿Qué ofrece {n}?', '¿Necesito cita en {n}?', '¿Qué idiomas hablan en {n}?'] },
  pt: { verblijf: ['Quantos hóspedes cabem em {n}?', 'A que distância {n} fica da praia?', '{n} tem piscina?'], eten: ['O que tem no cardápio de {n}?', 'Preciso reservar em {n}?', '{n} é bom para crianças?'], winkel: ['O que posso comprar em {n}?', 'Posso pagar com cartão em {n}?', 'Tem estacionamento em {n}?'], vervoer: ['Quanto custa alugar em {n}?', 'Posso retirar no aeroporto?', 'O que preciso para alugar em {n}?'], actief: ['O que dá para fazer em {n}?', 'Quanto tempo leva?', 'Preciso reservar {n} antes?'], zorg: ['Preciso de horário marcado em {n}?', 'Falam inglês ou português em {n}?', '{n} aceita meu seguro?'], dienst: ['O que {n} oferece?', 'Preciso de horário marcado em {n}?', 'Quais idiomas falam em {n}?'] },
};
// Alleen vragen die de chat met de gegevens van de pagina kan beantwoorden (Henkjan 15 nov 2026: "Zorg dus dat die chat beter wordt", na
// 'Hoeveel gasten kunnen er bij Relax, G9 logeren?' waarop de chat moest zeggen dat hij het niet wist). Elke vraag hierboven heeft een sleutel
// (zelfde volgorde in elke taal); een vraag blijft alleen staan als de omschrijving of de gegevens het antwoord bevatten. Het tekort wordt aangevuld
// met vragen waar het antwoord altijd in de context van de chat staat: dichtstbijzijnde strand, afstand tot Willemstad en het vliegveld, wat er in
// de buurt is en wat bezoekers ervan vinden.
const FAQ_SLEUTEL = { verblijf: ['gasten', 'strand', 'zwembad'], eten: ['kaart', 'reserveren', 'kinderen'], winkel: ['aanbod', 'pinnen', 'parkeren'], vervoer: ['prijs', 'vliegveld', 'nodig'], actief: ['aanbod', 'duur', 'boeken'], zorg: ['afspraak', 'talen', 'verzekering'], dienst: ['aanbod', 'afspraak', 'talen'] };
const HEEFT = { gasten: /\b(gast(en)?|guests?|persons?|personen|people|sleeps|slaapkamers?|bedrooms?|hu[eé]spedes|g[äa]ste|h[oó]spedes|pessoas|personas)\b/i, zwembad: /(zwembad|\bpool|piscina)/i,
  kaart: /(menu|kaart|gerecht|dish|pizza|burger|sushi|steak|grill|cuisine|keuken|local food|lokaal eten|comida|speisen)/i, reserveren: /(reserv|booking|boeken|book a table)/i, kinderen: /(kinder|kids?\b|child|famil|niños|crian)/i,
  pinnen: /(credit card|pinnen|\bpin\b|visa|mastercard|tarjeta|kreditkarte|cart[aã]o)/i, parkeren: /(parkeer|parking|parkplatz|estacionamiento)/i, prijs: /(\$\s?\d|usd|xcg|naf|€\s?\d|per (dag|day|nacht|night))/i,
  vliegveld: /(airport|vliegveld|luchthaven|aeropuerto|flughafen|aeroporto|hato)/i, nodig: /(rijbewijs|driver'?s? licen|f[üu]hrerschein|licencia|carteira|borg|deposit|kaution|dep[oó]sito)/i, duur: /(\d+\s?(uur|hours?|hrs?|minuten|minutes|min\b|stunden|horas))/i,
  boeken: /(book|boek|reserv|buchen)/i, afspraak: /(afspraak|appointment|walk-?in|termin|cita|agendamento)/i, talen: /(english|engels|spanish|spaans|papiament|nederlands|dutch|deutsch|español|ingl[eé]s|idioma|sprache)/i, verzekering: /(verzeker|insurance|seguro|versicher)/i };
const FAQ_EXTRA = {
  nl: { strand: 'Welk strand ligt het dichtst bij {n}?', stad: 'Hoe ver is {n} van Willemstad?', vlieg: 'Hoe ver is {n} van het vliegveld?', buurt: 'Wat is er in de buurt van {n}?', mening: 'Wat vinden bezoekers van {n}?' },
  en: { strand: 'Which beach is closest to {n}?', stad: 'How far is {n} from Willemstad?', vlieg: 'How far is {n} from the airport?', buurt: 'What is near {n}?', mening: 'What do visitors think of {n}?' },
  de: { strand: 'Welcher Strand liegt am nächsten bei {n}?', stad: 'Wie weit ist {n} von Willemstad?', vlieg: 'Wie weit ist {n} vom Flughafen?', buurt: 'Was gibt es in der Nähe von {n}?', mening: 'Was halten Besucher von {n}?' },
  es: { strand: '¿Qué playa está más cerca de {n}?', stad: '¿A qué distancia está {n} de Willemstad?', vlieg: '¿A qué distancia está {n} del aeropuerto?', buurt: '¿Qué hay cerca de {n}?', mening: '¿Qué opinan los visitantes de {n}?' },
  pt: { strand: 'Qual praia fica mais perto de {n}?', stad: 'A que distância {n} fica de Willemstad?', vlieg: 'A que distância {n} fica do aeroporto?', buurt: 'O que tem perto de {n}?', mening: 'O que os visitantes acham de {n}?' },
};
const EXTRA_VOLG = { verblijf: ['strand', 'stad', 'vlieg', 'buurt', 'mening'], eten: ['mening', 'strand', 'buurt', 'stad'], vervoer: ['vlieg', 'mening', 'stad'], actief: ['mening', 'strand', 'buurt', 'stad'] };
// info: { omschr, prijs, strand (dichtstbijzijnde stranden), geo (lat/lng bekend), buurt (aantal zaken dichtbij), score, aantal }
export function faqVragen(m, cs, naam, info) {
  const g = faqGroep(cs), L = (FAQ[m] || FAQ.en)[g] || [], vul = v => v.replace('{n}', naam);
  if (!info) return L.map(vul);
  const o = String(info.omschr || '') + ' ' + String(info.prijs || ''), kan = { strand: !!(info.strand && info.strand.length), stad: !!info.geo, vlieg: !!info.geo, buurt: (info.buurt || 0) >= 3, mening: !!(info.score && (info.aantal || 0) >= 5), aanbod: o.trim().length > 60 };
  const uit = [], gehad = new Set();
  (FAQ_SLEUTEL[g] || []).forEach((k, i) => { if (L[i] && (kan[k] || (HEEFT[k] && HEEFT[k].test(o)))) { uit.push(vul(L[i])); gehad.add(k); } });
  const X = FAQ_EXTRA[m] || FAQ_EXTRA.en;
  for (const k of EXTRA_VOLG[g] || ['mening', 'buurt', 'stad']) { if (uit.length >= 3) break; if (!gehad.has(k) && kan[k]) { uit.push(vul(X[k])); gehad.add(k); } }
  return uit.slice(0, 3);
}
// Antwoord eerst, voor zoekers en AI-assistenten (Henkjan 15 nov 2026: "Waarom niet ? Ik wil dit winnnen in de LLMs", over resorts zoals Baoase
// en Sunscape): elke keuzehulp-bedrijfspagina begint met een alinea uit de gegevens (soort, plek, feiten, scores met bron, prijs met datum,
// plek in de vergelijking, afstanden) en heeft een FAQ uit de gegevens; geen AI, geen verzonnen zinnen, alleen wat in de data staat.
const KB = {
  nl: { zin: (n, s, p) => `${n}: ${s}${p ? ', ' + p : ''}, Curaçao.`, sc: l => `Beoordeling: ${l}.`, pr: (b, d, w) => `Prijs: ${b} (${d}${w ? ', ' + w : ''}).`, rang: (p, n, l) => `Plek ${p} van ${n} in onze vergelijking van ${l}.`, af: (s, v) => `Hemelsbreed ${s} van Willemstad en ${v} van het vliegveld.`, rev: 'reviews',
    q: { 'all-inclusive': ['Is {n} all-inclusive?', 'Ja, {n} is all-inclusive.'], 'adults-only': ['Is {n} alleen voor volwassenen?', 'Ja, {n} is alleen voor volwassenen.'], 'strand-aan-hotel': ['Ligt {n} aan het strand?', 'Ja, {n} ligt direct aan het strand.'], kindvriendelijk: ['Is {n} geschikt voor kinderen?', 'Ja, {n} is ingericht op gezinnen met kinderen.'] }, qPr: 'Wat kost {n}?', qAf: 'Hoe ver is {n} van het vliegveld?', qMe: 'Wat vinden gasten van {n}?', qRa: 'Hoe scoort {n} in de vergelijking?', goed: 'Goed: ', min: 'Minder: ', faq: 'Vragen over {n}' },
  en: { zin: (n, s, p) => `${n}: ${s}${p ? ', ' + p : ''}, Curaçao.`, sc: l => `Ratings: ${l}.`, pr: (b, d, w) => `Price: ${b} (${d}${w ? ', ' + w : ''}).`, rang: (p, n, l) => `No. ${p} of ${n} in our comparison of ${l}.`, af: (s, v) => `${s} from Willemstad and ${v} from the airport as the crow flies.`, rev: 'reviews',
    q: { 'all-inclusive': ['Is {n} all-inclusive?', 'Yes, {n} is all-inclusive.'], 'adults-only': ['Is {n} adults-only?', 'Yes, {n} is for adults only.'], 'strand-aan-hotel': ['Is {n} on the beach?', 'Yes, {n} is right on the beach.'], kindvriendelijk: ['Is {n} good for kids?', 'Yes, {n} is set up for families with children.'] }, qPr: 'How much does {n} cost?', qAf: 'How far is {n} from the airport?', qMe: 'What do guests say about {n}?', qRa: 'How does {n} rank?', goed: 'Good: ', min: 'Less good: ', faq: 'Questions about {n}' },
  de: { zin: (n, s, p) => `${n}: ${s}${p ? ' in ' + p : ''} auf Curaçao.`, sc: l => `Bewertungen: ${l}.`, pr: (b, d, w) => `Preis: ${b} (${d}${w ? ', ' + w : ''}).`, rang: (p, n, l) => `Platz ${p} von ${n} in unserem Vergleich: ${l}.`, af: (s, v) => `Luftlinie ${s} bis Willemstad und ${v} bis zum Flughafen.`, rev: 'Bewertungen',
    q: { 'all-inclusive': ['Ist {n} All-inclusive?', 'Ja, {n} ist All-inclusive.'], 'adults-only': ['Ist {n} nur für Erwachsene?', 'Ja, {n} ist nur für Erwachsene.'], 'strand-aan-hotel': ['Liegt {n} am Strand?', 'Ja, {n} liegt direkt am Strand.'], kindvriendelijk: ['Ist {n} kinderfreundlich?', 'Ja, {n} ist auf Familien mit Kindern eingestellt.'] }, qPr: 'Was kostet {n}?', qAf: 'Wie weit ist {n} vom Flughafen?', qMe: 'Was sagen Gäste über {n}?', qRa: 'Wie schneidet {n} im Vergleich ab?', goed: 'Gut: ', min: 'Weniger gut: ', faq: 'Fragen zu {n}' },
  es: { zin: (n, s, p) => `${n}: ${s}${p ? ' en ' + p : ''}, Curazao.`, sc: l => `Valoraciones: ${l}.`, pr: (b, d, w) => `Precio: ${b} (${d}${w ? ', ' + w : ''}).`, rang: (p, n, l) => `Puesto ${p} de ${n} en nuestra comparación: ${l}.`, af: (s, v) => `En línea recta, ${s} de Willemstad y ${v} del aeropuerto.`, rev: 'reseñas',
    q: { 'all-inclusive': ['¿{n} es todo incluido?', 'Sí, {n} es todo incluido.'], 'adults-only': ['¿{n} es solo para adultos?', 'Sí, {n} es solo para adultos.'], 'strand-aan-hotel': ['¿{n} está en la playa?', 'Sí, {n} está frente a la playa.'], kindvriendelijk: ['¿{n} es bueno para niños?', 'Sí, {n} está pensado para familias con niños.'] }, qPr: '¿Cuánto cuesta {n}?', qAf: '¿A qué distancia está {n} del aeropuerto?', qMe: '¿Qué opinan los huéspedes de {n}?', qRa: '¿Cómo se compara {n}?', goed: 'Bueno: ', min: 'Menos bueno: ', faq: 'Preguntas sobre {n}' },
  pt: { zin: (n, s, p) => `${n}: ${s}${p ? ' em ' + p : ''}, Curaçao.`, sc: l => `Avaliações: ${l}.`, pr: (b, d, w) => `Preço: ${b} (${d}${w ? ', ' + w : ''}).`, rang: (p, n, l) => `${p}º de ${n} na nossa comparação: ${l}.`, af: (s, v) => `Em linha reta, ${s} de Willemstad e ${v} do aeroporto.`, rev: 'avaliações',
    q: { 'all-inclusive': ['{n} é tudo incluído?', 'Sim, {n} é tudo incluído.'], 'adults-only': ['{n} é só para adultos?', 'Sim, {n} é só para adultos.'], 'strand-aan-hotel': ['{n} fica na praia?', 'Sim, {n} fica de frente para a praia.'], kindvriendelijk: ['{n} é bom para crianças?', 'Sim, {n} é preparado para famílias com crianças.'] }, qPr: 'Quanto custa {n}?', qAf: 'A que distância {n} fica do aeroporto?', qMe: 'O que os hóspedes dizem de {n}?', qRa: 'Como {n} se compara?', goed: 'Bom: ', min: 'Menos bom: ', faq: 'Perguntas sobre {n}' },
};
// d = { naam, soort, plaats, feiten[], scores[{platform,score,max,aantal}], prijs (tekst), prijsDatum, prijsBron, pos, n, label, top3, kmStad, kmVlieg, tags[], voor[], tegen[], locale }
export function antwoordEerst(m, d) {
  const X = KB[m] || KB.en, vul = s => s.replace(/\{n\}/g, d.naam), g = (x, dd) => Number(x).toLocaleString(d.locale || 'en-US', { minimumFractionDigits: dd, maximumFractionDigits: dd });
  const sc = (d.scores || []).filter(x => x.score && x.aantal).slice(0, 3).map(x => `${x.platform} ${g(x.score, 1)}${x.max && x.max !== 5 ? '/' + x.max : '/5'} (${g(x.aantal, 0)} ${X.rev})`).join(', ');
  const af = d.kmStad != null && d.kmVlieg != null ? X.af(afstandTekst(d.kmStad, d.locale), afstandTekst(d.kmVlieg, d.locale)) : '';
  const plaats = m === 'nl' ? d.plaats : String(d.plaats || '').replace(/\s*\((oost|west|noord|zuid|centrum)\)/gi, ''); // '(oost)' is Nederlands
  const delen = [d.soort ? X.zin(d.naam, d.soort, plaats) : '', (d.feiten || []).length ? d.feiten.slice(0, 3).map(f => String(f).replace(/[.\s]+$/, '')).join('. ') + '.' : '', sc ? X.sc(sc) : '', d.prijs ? X.pr(d.prijs, d.prijsDatum || '', d.prijsBron || '') : ''].filter(Boolean); // plek en afstanden staan in de FAQ (pagina blijft onder 2.800 px)
  const vragen = [];
  for (const tg of ['all-inclusive', 'adults-only', 'strand-aan-hotel', 'kindvriendelijk']) if ((d.tags || []).includes(tg) && X.q[tg] && vragen.length < 2) vragen.push([vul(X.q[tg][0]), vul(X.q[tg][1])]);
  if (d.prijs) vragen.push([vul(X.qPr), X.pr(d.prijs, d.prijsDatum || '', d.prijsBron || '')]);
  if (af) vragen.push([vul(X.qAf), af]);
  if ((d.voor || []).length || sc) vragen.push([vul(X.qMe), [sc ? X.sc(sc) : '', (d.voor || []).length ? X.goed + d.voor.slice(0, 3).join('; ') + '.' : '', (d.tegen || []).length ? X.min + d.tegen.slice(0, 2).join('; ') + '.' : ''].filter(Boolean).join(' ')]);
  if (d.pos && d.n) vragen.push([vul(X.qRa), d.rangZin || X.rang(d.pos, d.n, d.label)]);
  const vr = vragen.slice(0, 5);
  return { tekst: delen.join(' '), vragen: vr, kop: vul(X.faq), mening: vr.some(v => v[0] === vul(X.qMe)) };
}

// vaste punten voor afstanden in de chat: Koningin Emmabrug (Punda, Willemstad) en Hato Airport (CUR)
export const PUNT = { stad: { lat: 12.1069, lng: -68.9353 }, vlieg: { lat: 12.1889, lng: -68.9597 } };
// telefoonnummer leesbaar, ook buiten Curaçao (15 nov 2026: +31618849204 stond als één blok op de pagina)
export function telMooi(t) {
  const d = String(t || '').replace(/[^\d]/g, '');
  if (/^5999\d{7}$/.test(d)) return '+599 9 ' + d.slice(4, 7) + ' ' + d.slice(7);
  if (/^9\d{7}$/.test(d)) return '+599 9 ' + d.slice(1, 4) + ' ' + d.slice(4);
  if (/^316\d{8}$/.test(d)) return '+31 6 ' + d.slice(3, 7) + ' ' + d.slice(7); // Nederland mobiel
  if (/^31\d{9}$/.test(d)) return '+31 ' + d.slice(2, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7);
  if (/^1\d{10}$/.test(d)) return '+1 ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7); // VS en Canada
  if (/^(49|32|57|297|599)\d{6,11}$/.test(d)) { const cc = d.match(/^(297|599|49|32|57)/)[1], r = d.slice(cc.length); return '+' + cc + ' ' + r.replace(/(\d{3})(?=\d{3,})/g, '$1 ').trim(); }
  return String(t || '').trim();
}
export function afstandKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
  const R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lng - a.lng) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const afstandTekst = (km, locale) => km < 1 ? Math.max(100, Math.round(km * 10) * 100) + ' m' : (Math.round(km * 10) / 10).toLocaleString(locale, { maximumFractionDigits: 1 }) + ' km';

// lijstrij voor een andere zaak (naam, korte plek, afstand of score)
// NAMEN IN HOOFDLETTERS uit Google-profielen leesbaar maken ("PRICE LESS MINIMARKET" → "Price Less Minimarket"); korte afkortingen blijven
export const leesbaar = t => String(t || '').split(', ').map(s => (/[A-ZÀ-Ý]{4}/.test(s) && s === s.toUpperCase()) || (/\p{L}{3}/u.test(s) && s === s.toLowerCase()) ? s.toLowerCase().replace(/(^|[\s(\/-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase()) : s).join(', '); // ook 'toko king' → 'Toko King' (14 nov 2026)
export function rij(url, y, rechts) {
  return '<a class="bz-rij" href="' + esc(url) + '" data-out="ander"><span class="bz-rn"><b>' + esc(leesbaar(y.naam)) + '</b><small>' + esc(leesbaar(adresKort(y))) + '</small></span><span class="bz-rr">' + rechts + '</span></a>';
}

// Alleen deze pagina's: strak, Curaçao-kleuren, één gevulde knop, geen grijs (huisstijl CLAUDE.md todayin)
export const UX_CSS = '.bz-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:0 0 6px}.bz-meta .nu{margin:0}.bz-sc{font-weight:700;font-size:17px}.bz-sc small{font-weight:500;font-size:14px;margin-left:4px}'
  + '.bz-plek{font-size:17px;margin:0 0 16px;line-height:1.45}'
  + 'main .tik{margin:0 0 18px}main .tik a.bz-btn{color:#002B7F!important}main .tik a.bz-btn.hoofd{color:#fff!important}main .tik a.bz-btn.wa{color:#063!important}main .tik.rb a.bz-btn.hoofd{background:#EEF1FC;border-color:transparent;color:#002B7F!important}main .tik.rb a.bz-btn.rt{background:#002B7F;border-color:#002B7F;color:#fff!important;order:-1}'
  + '.bz-feit{margin:4px 0 0;padding:0}.bz-feit>div{display:flex;gap:14px;padding:11px 0;border-top:1px solid #D5DBF3}.bz-feit dt{flex:0 0 88px;font-size:14px;font-weight:700;color:#002B7F;padding-top:2px}.bz-feit dd{margin:0;min-width:0;font-size:17px;line-height:1.45;overflow-wrap:anywhere}.bz-feit dd a{color:#111113;font-weight:600}'
  + '.bz-feit details{margin:4px 0 0}.bz-feit summary{cursor:pointer;font-size:14px;font-weight:700;color:#002B7F;list-style:none}.bz-feit summary::-webkit-details-marker{display:none}.bz-feit summary:after{content:" ▾"}.bz-wk{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;margin:8px 0 0;font-size:15px}.bz-wk b{font-weight:700}'
  + 'main h2.bz-h{font-size:18px;margin:30px 0 4px}.bz-l{margin:0}a.bz-rij{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #D5DBF3;text-decoration:none;color:#111113!important}.bz-rn{display:flex;flex-direction:column;min-width:0}.bz-rn b{font-weight:600;font-size:17px;overflow-wrap:anywhere}.bz-rn small{font-size:14px;margin-top:1px}.bz-rr{white-space:nowrap;font-weight:700;font-size:15px;color:#002B7F}'
  + '.bz-alle{margin:10px 0 0;font-size:15px;font-weight:700}.bz-bron{font-size:13px;margin:10px 0 0}.bz-eig{margin:26px 0 0;font-size:15px;font-weight:600}#bz-chat .ama{margin:18px 0 0!important}#bz-chat .ama-vb li.ama-feit small{display:block;margin:0 0 1px;font-size:11.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#F9E814}#bz-chat .ama-vb li.ama-feit a{font-weight:600}#bz-chat .ama-vb em.ama-st{font-style:normal;margin-left:10px;letter-spacing:3px;color:#F9E814}#bz-chat>.bz-feit{margin-top:18px}main section.cwa{background:none!important;border-top:1px solid #D5DBF3!important;border-radius:0!important;padding:22px 0 0!important;margin:30px 0 0!important}main section.cwa>p:first-child{font-size:17px!important}.rv-kort{border-top:1px solid #D5DBF3;padding:6px 0 4px;margin:0 0 4px}.rv-rij{display:flex;align-items:center;gap:14px}.rv-l{flex:0 0 88px;font-size:14px;font-weight:700;color:#002B7F}.rv-kort .rv-k button{font-size:26px;padding:2px 3px}.rv-kort .rv-gem{font-size:15px;margin:6px 0}'
  + ''
  + '@media (prefers-color-scheme:dark){.bz-feit>div,.rv-kort,main section.cwa{border-color:#2C3A72!important}.bz-feit dt,.bz-feit summary,.bz-rr,.rv-l{color:#C9D3F5}.bz-feit dd a,a.bz-rij{color:#F2F4FA!important}a.bz-rij{border-color:#2C3A72}main .tik a.bz-btn{color:#C9D3F5!important}main .tik a.bz-btn.hoofd,main .tik.rb a.bz-btn.rt{color:#002B7F!important}main .tik:not(.rb) a.bz-btn.hoofd{background:#F9E814!important;border-color:#F9E814!important}main .tik.rb a.bz-btn.hoofd{background:#18224A;border-color:transparent;color:#C9D3F5!important}main .tik.rb a.bz-btn.rt{background:#F9E814;border-color:#F9E814}}';

// Clickmind-proef in de pagina: beslissing per bezoeker (7 dagen bewaard), versies tonen, gezien en elke tik terugmelden; tikken per blok tellen
export const RONDE = 4; // moet gelijk zijn aan PROEVEN.curbedrijf.ronde in lib/proef.js; een oude beslissing in de browser vervalt dan
export const uxJs = API => '(function(){if(navigator.webdriver)return;var S="curbedrijf",O=' + JSON.stringify(API || '') + ',K="cwux1",R=' + RONDE + ',st=null,ua=navigator.userAgent,c=/iPhone|iPad|iPod/.test(ua)?"i":/Android/.test(ua)?"a":"d";'
  + 'function q(s){return document.querySelector(s)}function hit(k){try{window.__curHit&&window.__curHit(k)}catch(e){}}'
  + 'try{st=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}if(st&&(st.r!==R||!st.d||!st.v||Date.now()-Date.parse(st.d)>6*864e5))st=null;'
  + 'function stuur(o){if(!st)return;o.site=S;o.pid=st.pid;o.d=st.d;o.r=st.r;var j=JSON.stringify(o);try{if(!(navigator.sendBeacon&&navigator.sendBeacon(O+"/api/mm/proefev",new Blob([j],{type:"text/plain"}))))fetch(O+"/api/mm/proefev",{method:"POST",body:j,keepalive:true,headers:{"content-type":"text/plain"}})}catch(e){}}'
  + 'function zet(){var v=st.v||{},z={},n=0;var t=q(".tik[data-uxf]");if(t&&v.knop){if(v.knop==="b")t.classList.add("rb");z.knop=v.knop;n++}'
  + 'document.querySelectorAll("[data-ux]").forEach(function(el){var p=el.getAttribute("data-ux").split(":");if(v[p[0]])el.hidden=v[p[0]]!==p[1]});'
  + 'if(v.buurt&&q("[data-ux=\\"buurt:a\\"]")&&q("[data-ux=\\"buurt:b\\"]")){z.buurt=v.buurt;n++}'
  + 'var ch=q("#bz-chat");if(ch&&v.vragen&&/"q":1/.test(ch.getAttribute("data-vb")||"")){if(v.vragen==="b"){try{var nq=0;ch.setAttribute("data-vb",JSON.stringify(JSON.parse(ch.getAttribute("data-vb")).filter(function(x){return !x.q||++nq<=2})))}catch(e){}var lq=ch.querySelectorAll("li[data-q]");if(lq.length>2)lq[2].remove()}z.vragen=v.vragen;n++}'
  + 'if(n)stuur({e:"zie",c:c,v:z})}'
  + 'if(st)zet();else if(window.fetch)fetch(O+"/api/mm/proefkies?site="+S+"&c="+c,{credentials:"omit"}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok&&j.aan&&j.pid&&j.r===R){st={pid:j.pid,d:j.d,r:j.r,v:j.v};try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}zet()}}).catch(function(){});'
  + 'hit("bz-view");var bl={};'
  + 'document.addEventListener("click",function(e){var m=q("main");if(!e.target.closest)return;var a0=e.target.closest("#pms a[href]");if(a0){var hr=a0.getAttribute("href")||"";if(/^tel:/.test(hr))stuur({e:"bel"});else if(/google\\.com\\/maps/.test(hr))stuur({e:"route"});else if(/^https?:/.test(hr))stuur({e:"site"});return}if(!m||!m.contains(e.target))return;var a=e.target.closest("a,button,summary,input,textarea,select");if(!a)return;'
  + 'var b=e.target.closest("[data-blok]"),bn=b?b.getAttribute("data-blok"):(e.target.closest(".cwa")?"mail":"");if(bn&&!bl[bn]){bl[bn]=1;hit("bz-"+bn)}'
  + 'var o=a.getAttribute("data-out")||"",s="tik";if(/-tel$/.test(o))s="bel";else if(/-wa$/.test(o))s="wa";else if(/-route$/.test(o))s="route";else if(/^g-/.test(o)&&a.target==="_blank")s="site";else if(o==="eig")s="claim";else if(o==="ander")s="ander";else if(a.closest(".rv-k")||a.getAttribute("data-modus")==="review")s="ster";else if(a.closest("#bz-chat"))s="vraag";stuur({e:s})},true);'
  + 'document.addEventListener("submit",function(e){var f=e.target;if(f&&f.id==="amaf"){if(!bl.chat){bl.chat=1;hit("bz-chat")}stuur({e:"vraag"})}},true)})();';

// de chat van de site als blok, ingericht op een onderwerp (zaak, keuzehulp of soort zaken); terug = wat er zonder JavaScript staat
export function chatBlok({ ond, ondk, kop, ph, ctx = '', rv = null, vb = [], terug = '' }) {
  return '<div id="bz-chat" class="rz-ama" data-blok="chat" data-cw-ama data-ond="' + esc(ond) + '" data-ondk="' + esc(ondk) + '" data-kop="' + esc(kop) + '" data-ph="' + esc(ph) + '"' + (ctx ? ' data-ctx="' + esc(String(ctx).slice(0, 780)) + '"' : '') + (rv ? ' data-rv="' + esc(JSON.stringify(rv)) + '"' : '') + ' data-vb="' + esc(JSON.stringify(vb.filter(Boolean))) + '">' + terug + '</div>';
}
export const kortAntw = (s, n = 320) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, s.lastIndexOf(' ', n - 1)) + '…' : s; };

// tikken per blok over de laatste dagen (uit de bestaande teller cur:t:<dag>:bz-<blok>), per 100 bezoeken van een bedrijfspagina
export const BLOKKEN = ['knoppen', 'feiten', 'reviews', 'chat', 'mail', 'buurt', 'gevonden', 'eig'];
export async function uxStand(kv, dagen = 7) {
  const ds = Array.from({ length: Math.min(30, dagen) }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const ks = []; ds.forEach(d => ['view', ...BLOKKEN].forEach(b => ks.push('cur:t:' + d + ':bz-' + b)));
  const v = await kv.mget(...ks).catch(() => []); let i = 0; const per = {}, tot = { view: 0 };
  for (const d of ds) { const r = {}; for (const b of ['view', ...BLOKKEN]) { const x = Number(v[i++]) || 0; if (x) { r[b] = x; tot[b] = (tot[b] || 0) + x; } } if (Object.keys(r).length) per[d] = r; }
  const per100 = {}; if (tot.view) for (const b of BLOKKEN) if (tot[b]) per100[b] = Math.round(1000 * tot[b] / tot.view) / 10;
  return { uitleg: 'Bezoeken van een bedrijfspagina (view) en per blok hoe vaak iemand daar iets aantikte (eerste tik per blok per bezoek); per100 = per 100 bezoeken. Versies en waarde: /api/mm/proefstand?site=curbedrijf&vorm=tekst', dagen: ds.length, totaal: tot, per100, perDag: per };
}

export function sealedVoorbeeld(html) {
  const css = `
html:not(.hs-dk){--si-ink:#111113;--si-paper:#fff;--si-line:#E5E7EB}
html.hs-dk{--si-ink:#fff;--si-paper:#111113;--si-line:#51515A}
html body{background:var(--si-paper)!important;color:var(--si-ink)!important}
html body main{max-width:680px;margin-inline:auto;padding:32px 24px 0;font:400 16px/1.6 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
html body main h1{font-size:30px!important;line-height:1.15;letter-spacing:-.03em;margin:10px 0 16px!important;max-width:22ch}
html body main h2.bz-h{font-size:18px!important;margin:32px 0 12px!important}
html body main p,html body main a,html body main span,html body main dt,html body main dd,html body main small{color:var(--si-ink)!important}
html body main .live-dot,html body main .nu i{display:none}
html body main .bz-meta{gap:8px 16px;margin:0 0 20px}
html body main .bz-sc{font-size:16px!important}
html body main .bz-sc small{font-size:14px!important;font-weight:400}
html body main .nu{padding:0!important;background:transparent!important;border:0!important;color:var(--si-ink)!important;font-size:16px!important}
html body main .tik{display:flex;flex-wrap:wrap;gap:10px;margin:0 0 26px!important}
html body main .tik a.bz-btn{background:var(--si-paper)!important;border:1px solid var(--si-ink)!important;border-radius:999px!important;min-height:46px;padding:10px 20px!important;color:var(--si-ink)!important;font-size:16px!important;font-weight:400!important}
html body main .tik:not(.rb) a.bz-btn.hoofd,html body main .tik.rb a.bz-btn.rt{background:var(--si-ink)!important;color:var(--si-paper)!important}
html body main #bz-chat{border:1px solid var(--si-line);border-radius:16px;padding:20px;margin:0 0 28px;background:var(--si-paper)!important}
html body main #bz-chat .ama{margin:0!important;background:var(--si-paper)!important;color:var(--si-ink)!important;border:0!important;padding:0!important;box-shadow:none!important}
html body main #bz-chat .ama *{color:var(--si-ink)!important}
html body main #bz-chat input,html body main #bz-chat textarea{font:inherit!important;color:var(--si-ink)!important;background:var(--si-paper)!important;border:1px solid var(--si-ink)!important;border-radius:24px!important}
html body main #bz-chat input::placeholder{color:var(--si-ink)!important;opacity:1}
html body main #bz-chat .ama-vb{padding:0!important}
html body main #bz-chat .ama-vb li{background:transparent!important;border:1px solid var(--si-line)!important;border-radius:16px!important;padding:10px 14px!important;margin:8px 0!important;font-size:16px!important}
html body main #bz-chat button{border-radius:999px!important;border:1px solid var(--si-ink)!important;background:var(--si-paper)!important;color:var(--si-ink)!important;font:inherit!important}
html body main #bz-chat button[type=submit]{background:var(--si-ink)!important;color:var(--si-paper)!important}
html body main .bz-feit>div,html body main a.bz-rij{border-color:var(--si-line)!important}
html body main .bz-feit>div{padding:14px 0}
html body main .bz-feit dt{font-size:14px!important}
html body main .bz-feit dd,html body main .bz-rn b{font-size:16px!important}
html body main .bz-l{border:1px solid var(--si-line);border-radius:16px;overflow:hidden}
html body main a.bz-rij{padding:14px 18px!important}
html body main a.bz-rij:last-child{border-bottom:0}
html body main .bz-eig,html body main .bz-bron{font-size:14px!important;font-weight:400}
html body main section.cwa{border-color:var(--si-line)!important}
@media(max-width:640px){html body main{padding:24px 18px 0}html body main #bz-chat{padding:16px}html body main .bz-meta{gap:6px 12px}}
`;
  return html.replace('</head>', '<style id="bedrijf-sealed-voorbeeld">' + css + '</style></head>');
}
