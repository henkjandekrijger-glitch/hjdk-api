// Sealed Intent: twee landingspagina's voor de wig bedrijfsverkoop (Henkjan 16 nov 2026: "moeten zowiezo twee LPs zijn").
// Kopers leggen hun koopcriteria vast (met e-mail: zij zijn de betalende kant). Eigenaren gaan door naar de bestaande anonieme intake.
// Geen voorraad, prijzen of resultaten beweren die er niet zijn. Noindex tot Henkjan ze goedkeurt (LP_INDEX).
import { createHash, randomBytes } from 'node:crypto';
import { BASE, zegel } from './sealed.js';

export const LP_INDEX = false;
export const LP = {
  buyers: { nl: 'kopers', en: 'buyers', de: 'kaeufer' },
  owners: { nl: 'eigenaren', en: 'owners', de: 'inhaber' },
};
export const zoekLp = (taal, slug) => Object.keys(LP).find(k => LP[k][taal] === slug) || null;

export const BUYER_KINDS = ['search-fund', 'private-equity', 'strategic', 'family-office', 'individual', 'advisor'];
export const BUYER_SIZES = ['under-500k', '500k-1m', '1m-3m', '3m-10m', 'over-10m'];
export const BUYER_MODELS = ['per-intro', 'monthly', 'success', 'mix'];
export const BUYER_VALUES = ['under-250', '250-500', '500-1000', '1000-2500', 'over-2500'];
const SECTORS = ['technology', 'services', 'industry', 'health', 'retail', 'property', 'other'];
const MARKETS = ['worldwide', 'europe', 'north-america', 'latin-america', 'asia-pacific', 'africa-middle-east'];
const TTL = 180 * 86400;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (s, n) => String(s || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);

const T = {
  nl: {
    lang: 'Nederlands', home: 'Sealed Intent', other: { buyers: 'Ben je eigenaar?', owners: 'Ben je koper?' },
    card: { tag: 'Verzegeld antwoord van een eigenaar · voorbeeld', who: 'Installatiebedrijf, 40 mensen, Europa', lead: 'Ik verkoop, mits', a: ['het team minstens twee jaar blijft', 'ik zelf nog twaalf maanden meedraai', 'er binnen drie jaar niet wordt doorverkocht'], no: 'Niet bespreekbaar', nox: 'verhuizen van de vestiging', foot: 'Naam en bedrijf blijven dicht tot de eigenaar ja zegt.' },
    buyers: {
      title: 'Voor kopers: eigenaren die niet te koop staan, maar wel zouden verkopen | Sealed Intent',
      desc: 'Leg je koopcriteria vast. Wij benaderen passende eigenaren, zij antwoorden zonder naam met hun voorwaarden. Je betaalt pas voor een introductie die de eigenaar goedkeurt.',
      eyebrow: 'Voor kopers', h1: 'Eigenaren die niet te koop staan, maar wel zouden verkopen.',
      sub: 'Leg vast wat je koopt en wat je een eigenaar kunt bieden. Wij benaderen eigenaren die passen. Zij antwoorden zonder naam, met hun voorwaarden. Je betaalt pas voor een introductie die de eigenaar zelf goedkeurt.',
      cta: 'Leg je koopcriteria vast', stepsH: 'Zo werkt het',
      steps: [['Jij legt vast wat je zoekt', 'Sector, regio, omvang en wat je een eigenaar te bieden hebt. Vijf minuten.'], ['Wij benaderen passende eigenaren', 'Ze zien je criteria, niet je naam. Antwoorden kan zonder dat ze zich bekendmaken.'], ['Twee keer ja, dan pas een introductie', 'Past een antwoord, dan vragen we beide kanten om akkoord. Pas daarna betaal je.']],
      factsH: 'Wat het wel en niet is',
      facts: [['Geen lijst met bedrijven te koop', 'Deze eigenaren adverteren niet. Je bereikt ze hier of niet.'], ['Geen percentage van de deal', 'Een vast bedrag per geaccepteerde introductie, vooraf met je afgesproken.'], ['Geen kosten vooraf', 'Criteria vastleggen is gratis.'], ['We starten nu', 'Er ligt nog geen stapel eigenaren klaar. De eerste kopers bepalen welke sectoren en regio\'s we als eerste benaderen.']],
      formH: 'Je koopcriteria', formSub: 'Alleen wij lezen dit. Eigenaren zien je criteria zonder je naam of e-mail.',
      f: { kind: 'Wie ben je?', sector: 'Sector', market: 'Regio', size: 'EBITDA van het bedrijf dat je zoekt', criteria: 'Wat koop je, en wat kun je een eigenaar bieden?', criteriaPh: 'Bijvoorbeeld: B2B-dienstverleners met vaste contracten. Eigenaar mag aanblijven of binnen een jaar uitstappen. We kunnen binnen 90 dagen sluiten, zonder financieringsvoorbehoud.', model: 'Hoe betaal je het liefst?', value: 'Wat is een geaccepteerde introductie je waard?', mail: 'E-mail waarop we je kunnen bereiken', consent: 'Ik ga akkoord dat Sealed Intent deze gegevens maximaal 180 dagen bewaart om mij te benaderen over passende eigenaren.', send: 'Verstuur mijn criteria' },
      kinds: ['Search fund', 'Private equity of investeerder', 'Strategische koper', 'Family office', 'Particuliere koper', 'Adviseur namens een koper'],
      sizes: ['Tot € 500.000', '€ 500.000 tot € 1 miljoen', '€ 1 tot 3 miljoen', '€ 3 tot 10 miljoen', 'Meer dan € 10 miljoen'],
      models: ['Vast bedrag per introductie', 'Vast bedrag per maand', 'Alleen bij een gesloten deal', 'Combinatie'],
      values: ['Minder dan € 250', '€ 250 tot € 500', '€ 500 tot € 1.000', '€ 1.000 tot € 2.500', 'Meer dan € 2.500'],
      ok: 'Ontvangen.', okText: 'We lezen je criteria en mailen je binnen twee werkdagen met wat we voor je kunnen benaderen.', err: 'Dat ging niet goed. Controleer de velden en probeer het opnieuw.',
    },
    owners: {
      title: 'Voor eigenaren: je bedrijf staat niet te koop, maar onder de juiste voorwaarden? | Sealed Intent',
      desc: 'Schrijf op wanneer je wel zou verkopen. Zonder naam, zonder e-mail, zonder advertentie. Kopers moeten eerst aan jouw voorwaarden voldoen.',
      eyebrow: 'Voor eigenaren', h1: 'Je bedrijf staat niet te koop. Maar onder de juiste voorwaarden?',
      sub: 'Schrijf op wanneer je wel zou bewegen. Zonder naam, zonder e-mail, zonder makelaar die gaat bellen. Een koper moet eerst aan jouw voorwaarden voldoen voor hij weet wie je bent.',
      cta: 'Schrijf je voorwaarden op', cta2: 'Ik zoek een opvolger', stepsH: 'Zo werkt het',
      steps: [['Twee minuten', 'De uitkomst die je wilt, je voorwaarden en wat niet kan. Geen naam, geen bedrijfsnaam, geen e-mail.'], ['Je krijgt een privélink', 'Daarmee bekijk je de status en verwijder je alles in één klik. Bewaar hem goed: wij kunnen hem niet opnieuw sturen.'], ['Niets gaat door zonder jouw ja', 'Per koper beslis je opnieuw. Tot dat moment weet niemand wie je bent.']],
      factsH: 'Waarom zo',
      facts: [['Niemand hoeft het te weten', 'Zodra bekend is dat een bedrijf te koop staat, worden personeel, klanten en concurrenten onrustig. Hier is geen advertentie en geen profiel.'], ['Jij stelt de voorwaarden', 'Een koper reageert op wat jij belangrijk vindt, niet andersom.'], ['Het kost je niets', 'De koper betaalt, en alleen voor een introductie die jij goedkeurt.'], ['We starten nu', 'Verwacht morgen geen tien biedingen. Wel liggen je voorwaarden klaar voor de kopers die we benaderen.']],
      cardH: 'Zo ziet een koper het',
    },
    opt: { sector: ['IT en technologie', 'Zakelijke diensten', 'Industrie en productie', 'Zorg', 'Handel en consument', 'Vastgoed', 'Anders'], market: ['Wereldwijd', 'Europa', 'Noord-Amerika', 'Latijns-Amerika en Cariben', 'Azië en Oceanië', 'Afrika en Midden-Oosten'] },
    choose: 'Kies', foot: '© 2026 Sealed Intent · Adsfair B.V.', privacy: 'Hoe je anonimiteit werkt', privacySlug: 'privacy',
  },
  en: {
    lang: 'English', home: 'Sealed Intent', other: { buyers: 'Are you an owner?', owners: 'Are you a buyer?' },
    card: { tag: 'Sealed reply from an owner · example', who: 'Installation company, 40 people, Europe', lead: 'I would sell, provided', a: ['the team stays for at least two years', 'I stay involved for twelve more months', 'there is no resale within three years'], no: 'Not negotiable', nox: 'relocating the site', foot: 'Name and company stay sealed until the owner says yes.' },
    buyers: {
      title: 'For buyers: owners who are not for sale, but would sell | Sealed Intent',
      desc: 'Set down your acquisition criteria. We approach matching owners, who reply without a name and with their terms. You pay only for an introduction the owner approves.',
      eyebrow: 'For buyers', h1: 'Owners who are not for sale, but would sell.',
      sub: 'Set down what you buy and what you can offer an owner. We approach owners who fit. They reply without a name, with their terms. You pay only for an introduction the owner approves.',
      cta: 'Set down your criteria', stepsH: 'How it works',
      steps: [['You set down what you are looking for', 'Sector, region, size and what you can offer an owner. Five minutes.'], ['We approach matching owners', 'They see your criteria, not your name. They can reply without identifying themselves.'], ['Two yeses, then an introduction', 'When a reply fits, we ask both sides to agree. Only then do you pay.']],
      factsH: 'What it is and is not',
      facts: [['Not a list of businesses for sale', 'These owners do not advertise. You reach them here or not at all.'], ['No percentage of the deal', 'A fixed amount per accepted introduction, agreed with you beforehand.'], ['Nothing upfront', 'Setting down your criteria is free.'], ['We are starting now', 'There is no stack of owners waiting yet. The first buyers decide which sectors and regions we approach first.']],
      formH: 'Your acquisition criteria', formSub: 'Only we read this. Owners see your criteria without your name or email.',
      f: { kind: 'Who are you?', sector: 'Sector', market: 'Region', size: 'EBITDA of the business you are looking for', criteria: 'What do you buy, and what can you offer an owner?', criteriaPh: 'For example: B2B service companies with recurring contracts. The owner may stay on or step out within a year. We can close within 90 days, with no financing condition.', model: 'How would you rather pay?', value: 'What is an accepted introduction worth to you?', mail: 'Email where we can reach you', consent: 'I agree that Sealed Intent keeps these details for up to 180 days to contact me about matching owners.', send: 'Send my criteria' },
      kinds: ['Search fund', 'Private equity or investor', 'Strategic buyer', 'Family office', 'Individual buyer', 'Advisor acting for a buyer'],
      sizes: ['Up to $500,000', '$500,000 to $1 million', '$1 to 3 million', '$3 to 10 million', 'Over $10 million'],
      models: ['Fixed amount per introduction', 'Fixed amount per month', 'Only on a closed deal', 'A mix'],
      values: ['Under $250', '$250 to $500', '$500 to $1,000', '$1,000 to $2,500', 'Over $2,500'],
      ok: 'Received.', okText: 'We will read your criteria and email you within two working days with what we can approach for you.', err: 'That did not work. Check the fields and try again.',
    },
    owners: {
      title: 'For owners: your business is not for sale, but on the right terms? | Sealed Intent',
      desc: 'Write down when you would sell. No name, no email, no listing. A buyer has to meet your terms first.',
      eyebrow: 'For owners', h1: 'Your business is not for sale. But on the right terms?',
      sub: 'Write down when you would move. No name, no email, no broker calling you. A buyer has to meet your terms before they know who you are.',
      cta: 'Write down your terms', cta2: 'I am looking for a successor', stepsH: 'How it works',
      steps: [['Two minutes', 'The outcome you want, your terms and what is off the table. No name, no company name, no email.'], ['You get a private link', 'Use it to check the status and delete everything in one click. Keep it safe: we cannot send it again.'], ['Nothing moves without your yes', 'You decide again for each buyer. Until then nobody knows who you are.']],
      factsH: 'Why this way',
      facts: [['Nobody has to know', 'Once word gets out that a business is for sale, staff, customers and competitors get restless. Here there is no listing and no profile.'], ['You set the terms', 'A buyer responds to what matters to you, not the other way round.'], ['It costs you nothing', 'The buyer pays, and only for an introduction you approve.'], ['We are starting now', 'Do not expect ten offers tomorrow. Your terms will be ready for the buyers we approach.']],
      cardH: 'This is what a buyer sees',
    },
    opt: { sector: ['IT and technology', 'Business services', 'Industry and manufacturing', 'Healthcare', 'Trade and consumer', 'Real estate', 'Other'], market: ['Worldwide', 'Europe', 'North America', 'Latin America and Caribbean', 'Asia and Oceania', 'Africa and Middle East'] },
    choose: 'Choose', foot: '© 2026 Sealed Intent · Adsfair B.V.', privacy: 'How your anonymity works', privacySlug: 'privacy',
  },
  de: {
    lang: 'Deutsch', home: 'Sealed Intent', other: { buyers: 'Sind Sie Inhaber?', owners: 'Sind Sie Käufer?' },
    card: { tag: 'Versiegelte Antwort eines Inhabers · Beispiel', who: 'Installationsbetrieb, 40 Mitarbeiter, Europa', lead: 'Ich verkaufe, sofern', a: ['das Team mindestens zwei Jahre bleibt', 'ich selbst noch zwölf Monate mitarbeite', 'innerhalb von drei Jahren nicht weiterverkauft wird'], no: 'Nicht verhandelbar', nox: 'Verlegung des Standorts', foot: 'Name und Firma bleiben verschlossen, bis der Inhaber zustimmt.' },
    buyers: {
      title: 'Für Käufer: Inhaber, die nicht zum Verkauf stehen, aber verkaufen würden | Sealed Intent',
      desc: 'Halten Sie Ihre Kaufkriterien fest. Wir sprechen passende Inhaber an, sie antworten ohne Namen mit ihren Bedingungen. Sie zahlen erst für eine Vorstellung, der der Inhaber zustimmt.',
      eyebrow: 'Für Käufer', h1: 'Inhaber, die nicht zum Verkauf stehen, aber verkaufen würden.',
      sub: 'Halten Sie fest, was Sie kaufen und was Sie einem Inhaber bieten können. Wir sprechen passende Inhaber an. Sie antworten ohne Namen, mit ihren Bedingungen. Sie zahlen erst für eine Vorstellung, der der Inhaber selbst zustimmt.',
      cta: 'Kaufkriterien festhalten', stepsH: 'So funktioniert es',
      steps: [['Sie halten fest, was Sie suchen', 'Branche, Region, Größe und was Sie einem Inhaber bieten. Fünf Minuten.'], ['Wir sprechen passende Inhaber an', 'Sie sehen Ihre Kriterien, nicht Ihren Namen. Antworten ist möglich, ohne sich zu erkennen zu geben.'], ['Zweimal Ja, dann erst die Vorstellung', 'Passt eine Antwort, bitten wir beide Seiten um Zustimmung. Erst danach zahlen Sie.']],
      factsH: 'Was es ist und was nicht',
      facts: [['Keine Liste von Firmen zum Verkauf', 'Diese Inhaber inserieren nicht. Sie erreichen sie hier oder gar nicht.'], ['Kein Prozentsatz vom Kaufpreis', 'Ein fester Betrag je akzeptierter Vorstellung, vorab mit Ihnen vereinbart.'], ['Keine Kosten vorab', 'Kriterien festhalten ist kostenlos.'], ['Wir starten jetzt', 'Es wartet noch kein Stapel Inhaber. Die ersten Käufer bestimmen, welche Branchen und Regionen wir zuerst ansprechen.']],
      formH: 'Ihre Kaufkriterien', formSub: 'Nur wir lesen das. Inhaber sehen Ihre Kriterien ohne Namen oder E-Mail.',
      f: { kind: 'Wer sind Sie?', sector: 'Branche', market: 'Region', size: 'EBITDA des gesuchten Unternehmens', criteria: 'Was kaufen Sie, und was können Sie einem Inhaber bieten?', criteriaPh: 'Zum Beispiel: B2B-Dienstleister mit festen Verträgen. Der Inhaber kann bleiben oder binnen eines Jahres ausscheiden. Abschluss innerhalb von 90 Tagen, ohne Finanzierungsvorbehalt.', model: 'Wie zahlen Sie am liebsten?', value: 'Was ist Ihnen eine akzeptierte Vorstellung wert?', mail: 'E-Mail, unter der wir Sie erreichen', consent: 'Ich bin einverstanden, dass Sealed Intent diese Angaben bis zu 180 Tage speichert, um mich zu passenden Inhabern zu kontaktieren.', send: 'Kriterien senden' },
      kinds: ['Search Fund', 'Private Equity oder Investor', 'Strategischer Käufer', 'Family Office', 'Privater Käufer', 'Berater im Auftrag eines Käufers'],
      sizes: ['Bis 500.000 €', '500.000 € bis 1 Mio. €', '1 bis 3 Mio. €', '3 bis 10 Mio. €', 'Über 10 Mio. €'],
      models: ['Fester Betrag je Vorstellung', 'Fester Betrag je Monat', 'Nur bei Abschluss', 'Kombination'],
      values: ['Unter 250 €', '250 € bis 500 €', '500 € bis 1.000 €', '1.000 € bis 2.500 €', 'Über 2.500 €'],
      ok: 'Erhalten.', okText: 'Wir lesen Ihre Kriterien und melden uns innerhalb von zwei Werktagen per E-Mail mit dem, was wir für Sie ansprechen können.', err: 'Das hat nicht geklappt. Bitte prüfen Sie die Felder und versuchen Sie es erneut.',
    },
    owners: {
      title: 'Für Inhaber: Ihre Firma steht nicht zum Verkauf, aber zu den richtigen Bedingungen? | Sealed Intent',
      desc: 'Schreiben Sie auf, wann Sie verkaufen würden. Ohne Namen, ohne E-Mail, ohne Inserat. Ein Käufer muss zuerst Ihre Bedingungen erfüllen.',
      eyebrow: 'Für Inhaber', h1: 'Ihre Firma steht nicht zum Verkauf. Aber zu den richtigen Bedingungen?',
      sub: 'Schreiben Sie auf, wann Sie sich bewegen würden. Ohne Namen, ohne E-Mail, ohne Makler, der anruft. Ein Käufer muss Ihre Bedingungen erfüllen, bevor er weiß, wer Sie sind.',
      cta: 'Bedingungen aufschreiben', cta2: 'Ich suche einen Nachfolger', stepsH: 'So funktioniert es',
      steps: [['Zwei Minuten', 'Das gewünschte Ergebnis, Ihre Bedingungen und was ausgeschlossen ist. Kein Name, kein Firmenname, keine E-Mail.'], ['Sie erhalten einen privaten Link', 'Damit sehen Sie den Status und löschen alles mit einem Klick. Bewahren Sie ihn gut auf: Wir können ihn nicht erneut senden.'], ['Nichts geschieht ohne Ihr Ja', 'Sie entscheiden für jeden Käufer neu. Bis dahin weiß niemand, wer Sie sind.']],
      factsH: 'Warum so',
      facts: [['Niemand muss es erfahren', 'Sobald bekannt wird, dass eine Firma zum Verkauf steht, werden Mitarbeiter, Kunden und Wettbewerber unruhig. Hier gibt es kein Inserat und kein Profil.'], ['Sie stellen die Bedingungen', 'Ein Käufer reagiert auf das, was Ihnen wichtig ist, nicht umgekehrt.'], ['Es kostet Sie nichts', 'Der Käufer zahlt, und nur für eine Vorstellung, der Sie zustimmen.'], ['Wir starten jetzt', 'Erwarten Sie morgen keine zehn Angebote. Ihre Bedingungen liegen aber bereit für die Käufer, die wir ansprechen.']],
      cardH: 'Das sieht ein Käufer',
    },
    opt: { sector: ['IT und Technologie', 'Unternehmensdienstleistungen', 'Industrie und Produktion', 'Gesundheit', 'Handel und Konsum', 'Immobilien', 'Sonstiges'], market: ['Weltweit', 'Europa', 'Nordamerika', 'Lateinamerika und Karibik', 'Asien und Ozeanien', 'Afrika und Naher Osten'] },
    choose: 'Bitte wählen', foot: '© 2026 Sealed Intent · Adsfair B.V.', privacy: 'So funktioniert Ihre Anonymität', privacySlug: 'privacy',
  },
};

const CSS = `:root{--ink:#111113;--line:#E5E7EB;--line2:#B9BFC7;--accent:#2B47C4;--soft:#F4F6FC}
*,*::before,*::after{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth;scroll-padding-top:90px}
body{margin:0;background:#fff;color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
a{color:var(--ink)}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.top{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid var(--line)}.top-in{max-width:1040px;margin:0 auto;padding:18px 26px;display:flex;align-items:center;gap:20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.02em;text-decoration:none;color:var(--ink)}.brand svg{color:var(--accent)}.brand span span{color:var(--accent)}
.langs{margin-left:auto;display:flex;gap:2px;font-size:13px;font-weight:600}.langs a{text-decoration:none;padding:4px 7px;border-radius:4px}.langs a:hover{background:var(--soft)}.langs a[aria-current]{color:var(--accent)}
.nav-cta{font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}.nav-cta span{color:var(--accent);margin-left:6px}
main{max-width:820px;margin:0 auto;padding:72px 26px 0}
.eye{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin:0 0 22px;display:flex;align-items:center;gap:10px}.dot{width:7px;height:7px;background:var(--accent);border-radius:50%;flex:none}
h1{font-size:clamp(34px,5.6vw,52px);line-height:1.09;letter-spacing:-.035em;font-weight:700;margin:0 0 24px;max-width:760px;text-wrap:balance}
.lead{font-size:20px;line-height:1.6;max-width:660px;margin:0 0 32px}
.cta{display:inline-block;border:0;background:var(--ink);color:#fff;border-radius:6px;padding:15px 26px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}.cta:hover{background:var(--accent)}.cta[disabled]{opacity:.5}
.cta.ghost{background:#fff;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink);margin-left:12px}.cta.ghost:hover{background:var(--soft)}
.alt{display:block;margin-top:26px;font-size:17px;font-weight:600;text-decoration:none}.alt span{color:var(--accent);margin-left:6px}.alt:hover{text-decoration:underline}
section{padding:76px 0 0}h2{font-size:28px;line-height:1.2;letter-spacing:-.03em;font-weight:700;margin:0 0 28px;text-wrap:balance}
.sample{border:1px solid var(--line);border-radius:8px;box-shadow:0 14px 38px rgba(23,39,68,.06);overflow:hidden;margin-top:64px}
.sample-top{padding:16px 26px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;--bg:#fff}.sample-top svg{color:var(--accent);flex:none}.sample-top i{margin-left:auto;font-style:normal;color:var(--accent)}
.sample-in{padding:26px}.sample .who{font-size:20px;font-weight:700;letter-spacing:-.02em;margin:0 0 18px}.sample .lbl{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin:0}
.sample ul{margin:6px 0 20px;padding:0;list-style:none}.sample li{padding:13px 0 13px 30px;border-bottom:1px solid var(--line);position:relative;font-size:20px}.sample li::before{content:"";position:absolute;left:3px;top:24px;width:11px;height:6px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
.sample .no{font-size:20px;margin:6px 0 0}.sample-foot{background:var(--soft);padding:16px 26px;font-weight:600}
.steps{counter-reset:s;padding:0;margin:0;list-style:none;display:grid;gap:28px}.steps li{counter-increment:s;display:flex;gap:18px;align-items:flex-start}.steps li::before{content:counter(s);flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--line2);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:1px}
h3{font-size:20px;line-height:1.35;letter-spacing:-.02em;font-weight:700;margin:0 0 6px}.steps p,.facts p{margin:0;max-width:620px}
.facts{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);border-radius:8px;overflow:hidden}.facts div{padding:26px;border-bottom:1px solid var(--line)}.facts div:nth-child(odd){border-right:1px solid var(--line)}.facts div:nth-last-child(-n+2){border-bottom:0}
form{border:1px solid var(--line);border-radius:8px;padding:30px;display:grid;gap:20px;box-shadow:0 5px 22px rgba(21,33,75,.03)}.two{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:end}
label{display:grid;gap:8px;font-weight:600}select,input[type=email],textarea{font:inherit;font-weight:400;padding:12px 14px;border:1px solid var(--line2);border-radius:6px;background:#fff;color:var(--ink);width:100%;min-height:50px}textarea{min-height:150px;resize:vertical}
.chk{display:flex;gap:12px;font-weight:400;align-items:flex-start}.chk input{margin-top:7px;width:18px;height:18px;flex:none}.hp{position:absolute;left:-9999px}form .cta{justify-self:start}form h2{margin:0}#note{margin:0;color:#B3261E;font-weight:600}#note:empty{display:none}.formsub{margin:-14px 0 28px}
.end{text-align:center;padding:84px 0 0}.end h2{max-width:600px;margin:0 auto 28px}
footer{border-top:1px solid var(--line);margin-top:84px}footer div{max-width:820px;margin:0 auto;padding:20px 26px 28px;font-size:13px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}footer a{text-decoration:none}footer a:hover{text-decoration:underline}
@media(max-width:680px){.top-in{padding:14px 20px;gap:12px}.nav-cta{display:none}main{padding:44px 20px 0}.lead{font-size:17px}.two,.facts{grid-template-columns:1fr}.facts div,.facts div:nth-child(odd){border-right:0;border-bottom:1px solid var(--line)}.facts div:last-child{border-bottom:0}.cta.ghost{margin:12px 0 0;display:block;text-align:center}.cta{display:block;text-align:center}form .cta{justify-self:stretch}section{padding-top:56px}.sample{margin-top:48px}.sample-in{padding:20px}.sample li,.sample .no,.sample .who{font-size:17px}.sample li::before{top:22px}form{padding:20px}footer{margin-top:60px}}`;

const pad = (taal, kind) => '/' + taal + '/' + LP[kind][taal];
const opts = (values, labels, choose) => `<option value="">${esc(choose)}</option>` + values.map((v, i) => `<option value="${v}">${esc(labels[i])}</option>`).join('');

function kaart(C, kop) {
  const [tag, label] = (kop ? kop + ' · ' + C.card.tag.split(' · ')[1] : C.card.tag).split(' · ');
  return `<aside class="sample" aria-label="${esc(tag)}"><div class="sample-top">${zegel(18)}<span>${esc(tag)}</span><i>${esc(label || '')}</i></div><div class="sample-in"><p class="who">${esc(C.card.who)}</p><p class="lbl">${esc(C.card.lead)}</p><ul>${C.card.a.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="lbl">${esc(C.card.no)}</p><p class="no">${esc(C.card.nox)}</p></div><div class="sample-foot">${esc(C.card.foot)}</div></aside>`;
}

function koperFormulier(taal, C) {
  const P = C.buyers, f = P.f;
  const js = `(function(){var F=document.getElementById('koper'),N=document.getElementById('note');F.onsubmit=async function(e){e.preventDefault();if(!F.reportValidity())return;var b=F.querySelector('[type=submit]');b.disabled=true;N.textContent='';var E=F.elements,ch='direct-unknown';try{ch=sessionStorage.getItem('si_source_v2')||ch}catch(x){}var body={kind:E.kind.value,sector:E.sector.value,market:E.market.value,size:E.size.value,criteria:E.criteria.value,model:E.model.value,value:E.value.value,mail:E.mail.value,consent:E.consent.checked,website:E.website.value,language:${JSON.stringify(taal)},channel:ch};try{var r=await fetch('/api/sealed?op=koper',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});var j=await r.json();if(!r.ok||!j.ok){N.textContent=${JSON.stringify(P.err)};b.disabled=false;return}F.replaceChildren();var h=document.createElement('h2');h.textContent=${JSON.stringify(P.ok)};var p=document.createElement('p');p.textContent=${JSON.stringify(P.okText)};F.append(h,p)}catch(x){N.textContent=${JSON.stringify(P.err)};b.disabled=false}}})();`;
  return `<section id="criteria"><h2>${esc(P.formH)}</h2><p class="formsub">${esc(P.formSub)}</p>
<form id="koper" novalidate>
<label>${esc(f.kind)}<select name="kind" required>${opts(BUYER_KINDS, P.kinds, C.choose)}</select></label>
<div class="two"><label>${esc(f.sector)}<select name="sector" required>${opts(SECTORS, C.opt.sector, C.choose)}</select></label><label>${esc(f.market)}<select name="market" required>${opts(MARKETS, C.opt.market, C.choose)}</select></label></div>
<label>${esc(f.size)}<select name="size" required>${opts(BUYER_SIZES, P.sizes, C.choose)}</select></label>
<label>${esc(f.criteria)}<textarea name="criteria" required minlength="40" maxlength="1200" placeholder="${esc(f.criteriaPh)}"></textarea></label>
<div class="two"><label>${esc(f.model)}<select name="model" required>${opts(BUYER_MODELS, P.models, C.choose)}</select></label><label>${esc(f.value)}<select name="value" required>${opts(BUYER_VALUES, P.values, C.choose)}</select></label></div>
<label>${esc(f.mail)}<input type="email" name="mail" required maxlength="160" autocomplete="email"></label>
<label class="hp" aria-hidden="true">Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
<label class="chk"><input type="checkbox" name="consent" required><span>${esc(f.consent)}</span></label>
<p id="note" role="status"></p><button class="cta" type="submit">${esc(f.send)}</button>
</form></section><script>${js}</script>`;
}

export function renderLp(taal, slug, { gscMeta, growthScript = '' } = {}) {
  const kind = zoekLp(taal, slug), C = T[taal]; if (!kind || !C) return null;
  const P = C[kind], ander = kind === 'buyers' ? 'owners' : 'buyers', canon = BASE + pad(taal, kind);
  const alts = Object.keys(T).map(t => `<link rel="alternate" hreflang="${t}" href="${BASE + pad(t, kind)}">`).join('') + `<link rel="alternate" hreflang="x-default" href="${BASE + pad('en', kind)}">`;
  const talen = Object.keys(T).map(t => `<a href="${pad(t, kind)}" hreflang="${t}"${t === taal ? ' aria-current="page"' : ''}>${t.toUpperCase()}</a>`).join('');
  const seal = '/' + taal + '/seal?type=';
  const pijl = ' <span aria-hidden="true">→</span>';
  const hoofdCta = kind === 'buyers' ? `<a class="cta" href="#criteria">${esc(P.cta)}${pijl}</a>` : `<a class="cta" href="${seal}sale">${esc(P.cta)}${pijl}</a><a class="cta ghost" href="${seal}succession">${esc(P.cta2)}</a>`;
  const merk = `<span>sealed<span>intent</span></span>`;
  return `<!doctype html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(P.title)}</title><meta name="description" content="${esc(P.desc)}"><link rel="canonical" href="${canon}">${alts}${LP_INDEX ? '' : '<meta name="robots" content="noindex, follow">'}${gscMeta ? `<meta name="google-site-verification" content="${esc(gscMeta)}">` : ''}<meta property="og:title" content="${esc(P.h1)}"><meta property="og:description" content="${esc(P.desc)}"><meta property="og:url" content="${canon}"><meta property="og:image" content="${BASE}/icon-512.png"><link rel="icon" href="/logo.svg" type="image/svg+xml"><meta name="theme-color" content="#ffffff"><style>${CSS}</style></head><body>
<header class="top"><div class="top-in"><a class="brand" href="/${taal}">${zegel(26)}${merk}</a><nav class="langs" aria-label="Language">${talen}</nav><a class="nav-cta" href="${kind === 'buyers' ? '#criteria' : seal + 'sale'}">${esc(P.cta)}<span aria-hidden="true">↗</span></a></div></header>
<main><p class="eye"><span class="dot" aria-hidden="true"></span>${esc(P.eyebrow)}</p><h1>${esc(P.h1)}</h1><p class="lead">${esc(P.sub)}</p>${hoofdCta}<a class="alt" href="${pad(taal, ander)}">${esc(C.other[kind])}<span aria-hidden="true">→</span></a>
${kaart(C, P.cardH)}
<section><h2>${esc(P.stepsH)}</h2><ol class="steps">${P.steps.map(x => `<li><div><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div></li>`).join('')}</ol></section>
<section><h2>${esc(P.factsH)}</h2><div class="facts">${P.facts.map(x => `<div><h3>${esc(x[0])}</h3><p>${esc(x[1])}</p></div>`).join('')}</div></section>
${kind === 'buyers' ? koperFormulier(taal, C) : `<div class="end"><h2>${esc(P.h1)}</h2><a class="cta" href="${seal}sale">${esc(P.cta)}${pijl}</a></div>`}</main>
<footer><div><span>${esc(C.foot)}</span><a href="/${taal}/${C.privacySlug}">${esc(C.privacy)}</a></div></footer>${growthScript}</body></html>`;
}

export function validateBuyer(body) {
  if (body.website) return { error: 'spam' };
  const criteria = clean(body.criteria, 1200), mail = clean(body.mail, 160).toLowerCase();
  if (!BUYER_KINDS.includes(body.kind) || !SECTORS.includes(body.sector) || !MARKETS.includes(body.market) || !BUYER_SIZES.includes(body.size) || !BUYER_MODELS.includes(body.model) || !BUYER_VALUES.includes(body.value)) return { error: 'incomplete' };
  if (criteria.length < 40) return { error: 'more-detail' };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(mail)) return { error: 'mail' };
  if (body.consent !== true) return { error: 'consent' };
  return { value: { kind: body.kind, sector: body.sector, market: body.market, size: body.size, model: body.model, value: body.value, criteria, mail, language: T[body.language] ? body.language : 'en' } };
}

// Koper bewaren: 180 dagen, eigen lijst. De melding bevat geen e-mail of vrije tekst.
export async function bewaarKoper(kv, req, body, meld) {
  const v = validateBuyer(body); if (v.error) return { status: 400, body: { ok: false, error: v.error } };
  const dag = new Date().toISOString().slice(0, 10);
  const ip = String(req.headers?.['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const rk = 'si:b-rate:' + createHash('sha256').update(dag + ':' + ip).digest('hex').slice(0, 32);
  const n = await kv.incr(rk); if (n === 1) await kv.raw(['EXPIRE', rk, 86400]);
  if (n > 5) return { status: 429, body: { ok: false, error: 'rate' } };
  const id = randomBytes(12).toString('hex');
  const rec = { schema: 1, id, ...v.value, submitted: new Date().toISOString(), status: 'new' };
  await kv.set('si:b:' + id, rec, { ex: TTL });
  try { await kv.raw(['LPUSH', 'si:buyers', id]); await kv.raw(['LTRIM', 'si:buyers', 0, 999]); await kv.incr('si:buyer-count'); const ch = ['search', 'ai', 'email', 'paid', 'direct-unknown'].includes(body.channel) ? body.channel : 'direct-unknown', ck = 'si:buyer-conv:' + dag + ':' + ch; await kv.incr(ck); await kv.raw(['EXPIRE', ck, 100 * 86400]); } catch { /* record staat */ }
  if (meld) { try { await meld(`Nieuwe koper legt criteria vast: ${rec.kind}, ${rec.sector}, ${rec.market}, EBITDA ${rec.size}. Betaalt liefst ${rec.model}, introductie waard ${rec.value}. Bekijk met op=kopers.`); } catch { /* melding is extra */ } }
  return { status: 201, body: { ok: true } };
}

export async function lijstKopers(kv) {
  const ids = await kv.raw(['LRANGE', 'si:buyers', 0, 99]).catch(() => []);
  const recs = ids.length ? await kv.mget(...ids.map(i => 'si:b:' + i)) : [];
  return { n: +(await kv.get('si:buyer-count').catch(() => 0)) || 0, kopers: recs.filter(Boolean) };
}
