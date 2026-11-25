// Sealed Intent: de prijszinnen op de site gelijk aan de mails (open punt 1 uit de overdracht van 21 nov 2026). De mails zeggen: eerste vraag
// en eerste antwoord gratis, daarna eenmalig € 250 exclusief btw per eigenaar. De site zei nog "de eerste introductie is gratis, daarna spreken
// we de prijs vooraf af". Dit bestand vervangt die zinnen in de uitvoer (pagina's en antwoorden van de chat), langste zin eerst.
// Het staat uit tot SITE_PRIJS_GELIJK in lib/sealed-mail.js true is (Henkjans akkoord op deze zinnen). Vooraf bekijken op de beschermde host:
// /api/sealed?taal=nl&slug=kopers&prijs=1. Controle: scripts/test-sealed-prijs.mjs loopt alle pagina's na op oude zinnen.
const Z = [
  // Hoe het werkt, blok Wat het kost
  ['Voor kopers is vastleggen gratis en de eerste introductie ook. Daarna spreken we de prijs vooraf met je af. Je betaalt alleen voor een introductie die de eigenaar zelf heeft goedgekeurd.', 'Voor kopers is vastleggen gratis, en de eerste vraag aan een eigenaar en zijn eerste antwoord ook. Verder praten met die eigenaar kost eenmalig € 250 exclusief btw. Je betaalt dus pas als een eigenaar je heeft geantwoord.'],
  ['For buyers, setting it down is free and so is the first introduction. After that we agree the price with you up front. You pay only for an introduction the owner has approved.', 'For buyers, setting it down is free, and so are the first question to an owner and his first answer. Continuing with that owner costs a one-off € 250 excluding VAT. So you pay only once an owner has answered you.'],
  ['Für Käufer ist das Festhalten kostenlos, die erste Vorstellung auch. Danach vereinbaren wir den Preis vorab mit Ihnen. Sie zahlen nur für eine Vorstellung, der der Inhaber selbst zugestimmt hat.', 'Für Käufer ist das Festhalten kostenlos, ebenso die erste Frage an einen Inhaber und seine erste Antwort. Weiterschreiben mit diesem Inhaber kostet einmalig 250 € zzgl. MwSt. Sie zahlen also erst, wenn ein Inhaber Ihnen geantwortet hat.'],
  // Vast antwoord in de chat op "wat kost het"
  ['Vastleggen is gratis en de eerste introductie ook. Daarna spreken we de prijs vooraf met je af.', 'Vastleggen is gratis, en je eerste vraag aan een eigenaar en zijn eerste antwoord ook. Verder praten kost eenmalig € 250 exclusief btw per eigenaar.'],
  ['Setting it down is free and so is the first introduction. After that we agree the price with you up front.', 'Setting it down is free, and so are your first question to an owner and his first answer. Continuing costs a one-off € 250 excluding VAT per owner.'],
  ['Festhalten ist kostenlos, die erste Vorstellung auch. Danach vereinbaren wir den Preis vorab mit Ihnen.', 'Festhalten ist kostenlos, ebenso Ihre erste Frage an einen Inhaber und seine erste Antwort. Weiterschreiben kostet einmalig 250 € zzgl. MwSt. je Inhaber.'],
  ['De koper betaalt, en pas voor een introductie die jij goedkeurt.', 'De koper betaalt, en pas nadat jij hem hebt geantwoord.'],
  ['The buyer pays, and only for an introduction you approve.', 'The buyer pays, and only after you have answered him.'],
  ['Der Käufer zahlt, und erst für eine Vorstellung, der Sie zustimmen.', 'Der Käufer zahlt, und erst nachdem Sie ihm geantwortet haben.'],
  // Kaart van de koper na het vastleggen
  ['De eerste introductie is gratis. Daarna spreken we de prijs vooraf met je af.', 'Je eerste vraag aan een eigenaar en zijn eerste antwoord zijn gratis. Verder praten kost eenmalig € 250 exclusief btw per eigenaar.'],
  ['The first introduction is free. After that we agree the price with you up front.', 'Your first question to an owner and his first answer are free. Continuing costs a one-off € 250 excluding VAT per owner.'],
  ['Die erste Vorstellung ist kostenlos. Danach vereinbaren wir den Preis vorab mit Ihnen.', 'Ihre erste Frage an einen Inhaber und seine erste Antwort sind kostenlos. Weiterschreiben kostet einmalig 250 € zzgl. MwSt. je Inhaber.'],
  // Korte regel onder de kop en de openingszin van de chat
  ['De eerste introductie is gratis.', 'De eerste vraag en het eerste antwoord zijn gratis.'],
  ['The first introduction is free.', 'The first question and the first answer are free.'],
  ['Die erste Vorstellung ist kostenlos.', 'Die erste Frage und die erste Antwort sind kostenlos.'],
];
// Wat na het vervangen nergens meer mag staan (de test en de dagelijkse controle gebruiken dit).
export const OUD_PRIJS = /eerste introductie (?:is gratis|ook)|prijs vooraf met je af|first introduction|agree the price with you|erste Vorstellung (?:ist kostenlos|auch)|den Preis vorab/i;
export function prijsTekst(body, aan) {
  if (!aan || typeof body !== 'string') return body;
  let s = body; for (const [a, b] of Z) if (s.includes(a)) s = s.split(a).join(b);
  return s;
}
export const PRIJSZINNEN = Z;
