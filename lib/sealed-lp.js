// Sealed Intent: teksten en kopersopslag voor de twee ingangen (de pagina zelf is de chat, lib/sealed-chatpage.js). Oorspronkelijk: twee landingspagina's voor de wig bedrijfsverkoop (Henkjan 16 nov 2026: "moeten zowiezo twee LPs zijn").
// Kopers leggen hun koopcriteria vast (met e-mail: zij zijn de betalende kant). Eigenaren gaan door naar de bestaande anonieme intake.
// Geen voorraad, prijzen of resultaten beweren die er niet zijn. Noindex tot Henkjan ze goedkeurt (LP_INDEX).
import { createHash, randomBytes } from 'node:crypto';

export const LP_INDEX = true; // Henkjan 17 nov 2026 ("Ja prima voer door"): de twee ingangen zijn de site, dus indexeerbaar en in de sitemap
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

export const LPT = T;

export function validateBuyer(body) {
  if (body.website) return { error: 'spam' };
  const criteria = clean(body.criteria, 1200), mail = clean(body.mail, 160).toLowerCase();
  if (!BUYER_KINDS.includes(body.kind) || !SECTORS.includes(body.sector) || !MARKETS.includes(body.market) || !BUYER_SIZES.includes(body.size)) return { error: 'incomplete' };
  // betaalwijze en waarde zijn sinds 17 nov 2026 uit de chat (panel: prijsonderzoek voordat een koper iets heeft gezien); oude inzendingen hebben ze nog
  if ((body.model != null && !BUYER_MODELS.includes(body.model)) || (body.value != null && !BUYER_VALUES.includes(body.value))) return { error: 'incomplete' };
  if (criteria.length < 15) return { error: 'more-detail' };
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(mail)) return { error: 'mail' };
  if (body.consent !== true) return { error: 'consent' };
  return { value: { kind: body.kind, sector: body.sector, market: body.market, size: body.size, model: body.model || null, value: body.value || null, criteria, mail, language: T[body.language] ? body.language : 'en' } };
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
  try { await kv.raw(['LPUSH', 'si:buyers', id]); await kv.raw(['LTRIM', 'si:buyers', 0, 999]); await kv.incr('si:buyer-count'); const ch = ['search', 'ai', 'email', 'paid', 'direct-unknown', 'test'].includes(body.channel) ? body.channel : 'direct-unknown', ck = 'si:buyer-conv:' + dag + ':' + ch; await kv.incr(ck); await kv.raw(['EXPIRE', ck, 100 * 86400]); } catch { /* record staat */ }
  if (meld) { try { await meld(`Nieuwe koper legt criteria vast: ${rec.kind}, ${rec.sector}, ${rec.market}, EBITDA ${rec.size}. Bekijk met op=kopers.`); } catch { /* melding is extra */ } }
  return { status: 201, body: { ok: true, id } };
}
// Aanvulling na het vastleggen: wat de koper een eigenaar biedt. Het id (24 willekeurige tekens) is het bewijs dat het dezelfde koper is.
export async function vulKoperAan(kv, body) {
  const id = String(body.id || ''); if (!/^[a-f0-9]{24}$/.test(id)) return false;
  const offer = (Array.isArray(body.offer) ? body.offer : []).slice(0, 9).map(x => clean(x, 60)).filter(x => x.length > 2 && !/[@]|https?:/.test(x)); if (!offer.length) return false;
  const rec = await kv.get('si:b:' + id).catch(() => null); if (!rec || rec.offer) return false;
  rec.offer = offer; const ttl = Math.max(86400, TTL - Math.round((Date.now() - Date.parse(rec.submitted)) / 1000)); await kv.set('si:b:' + id, rec, { ex: ttl }); return true;
}

export async function lijstKopers(kv) {
  const ids = await kv.raw(['LRANGE', 'si:buyers', 0, 99]).catch(() => []);
  const recs = ids.length ? await kv.mget(...ids.map(i => 'si:b:' + i)) : [];
  return { n: +(await kv.get('si:buyer-count').catch(() => 0)) || 0, kopers: recs.filter(Boolean) };
}
