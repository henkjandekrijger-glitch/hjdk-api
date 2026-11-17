// Sealed Intent: de lerende chat met pills (Henkjan 16 nov 2026: "Het moet allemaal draaien om lerende chat met pills ... Je kiest koper /
// verkoper en daarna gewoon pills. Die chat leert ... In de chat wordt alles geregeld. EXTREEM lerend ... leer hoe we converteren").
// Lessen uit WAM (lib/wam-overdracht.js): Thompson per onderdeel, terugbereiken is het lek (dus een seintje vragen ín de chat),
// vertrouwen eerst, vaste dagkosten voor AI, een coach die hoogstens een paar wijzigingen per ronde doet.
// Wat leert: de openingszin, de volgorde van de stappen en de formulering van elke vraag (per rol). Elke stap meet getoond en beantwoord;
// de leerronde (cron, elk uur) zet verliezers uit en laat de coach één nieuwe formulering maken voor de stap waar de meeste mensen afhaken.
import { BUYER_KINDS, BUYER_SIZES, BUYER_MODELS, BUYER_VALUES, LPT } from './sealed-lp.js';

const L = (nl, en, de) => ({ nl, en, de });
const TALEN = ['nl', 'en', 'de'];
export const ROLLEN = ['buyers', 'owners'];
const SECTORS = ['technology', 'services', 'industry', 'health', 'retail', 'property', 'other'];
const MARKETS = ['worldwide', 'europe', 'north-america', 'latin-america', 'asia-pacific', 'africa-middle-east'];
const TIMES = ['exploring', 'three-months', 'one-year', 'later'];
const TIJD = { nl: ['Eerst verkennen', 'Binnen drie maanden', 'Binnen een jaar', 'Later'], en: ['Exploring first', 'Within three months', 'Within a year', 'Later'], de: ['Erst sondieren', 'Innerhalb von drei Monaten', 'Innerhalb eines Jahres', 'Später'] };

// Vaste formuleringen (arm a, b). De coach voegt armen toe in Redis (si:chat:dyn).
const STAP = {
  buyers: {
    kind: { q: { a: L('Wie ben je?', 'Who are you?', 'Wer sind Sie?'), b: L('Namens wie koop je?', 'Who are you buying for?', 'Für wen kaufen Sie?') }, enum: BUYER_KINDS, lab: t => LPT[t].buyers.kinds },
    sector: { q: { a: L('In welke sector zoek je?', 'Which sector are you looking in?', 'In welcher Branche suchen Sie?') }, enum: SECTORS, lab: t => LPT[t].opt.sector },
    market: { q: { a: L('Waar moet het bedrijf zitten?', 'Where should the business be?', 'Wo soll das Unternehmen sitzen?') }, enum: MARKETS, lab: t => LPT[t].opt.market },
    size: { q: { a: L('Hoe groot? EBITDA per jaar.', 'How large? EBITDA per year.', 'Wie groß? EBITDA pro Jahr.'), b: L('Welke winst (EBITDA) moet het bedrijf maken?', 'What profit (EBITDA) should the business make?', 'Welchen Gewinn (EBITDA) soll das Unternehmen machen?') }, enum: BUYER_SIZES, lab: t => LPT[t].buyers.sizes },
    offer: { q: { a: L('Wat kun je een eigenaar bieden? Kies wat klopt.', 'What can you offer an owner? Pick what applies.', 'Was können Sie einem Inhaber bieten? Wählen Sie, was zutrifft.'), b: L('Waarom zou een eigenaar met jou praten?', 'Why would an owner talk to you?', 'Warum sollte ein Inhaber mit Ihnen sprechen?') }, multi: true,
      opts: [L('Eigenaar mag aanblijven', 'Owner can stay on', 'Inhaber kann bleiben'), L('Eigenaar kan direct uitstappen', 'Owner can step out right away', 'Inhaber kann sofort ausscheiden'), L('Team blijft', 'Team stays', 'Team bleibt'), L('Sluiten binnen 90 dagen', 'Close within 90 days', 'Abschluss in 90 Tagen'), L('Geen financieringsvoorbehoud', 'No financing condition', 'Kein Finanzierungsvorbehalt'), L('Naam en vestiging blijven', 'Name and site stay', 'Name und Standort bleiben')] },
    value: { q: { a: L('Wat is een introductie die de eigenaar zelf goedkeurt je waard?', 'What is an introduction the owner approves worth to you?', 'Was ist Ihnen eine vom Inhaber bestätigte Vorstellung wert?') }, enum: BUYER_VALUES, lab: t => LPT[t].buyers.values },
    model: { q: { a: L('Hoe betaal je het liefst?', 'How would you rather pay?', 'Wie zahlen Sie am liebsten?') }, enum: BUYER_MODELS, lab: t => LPT[t].buyers.models },
    mail: { q: { a: L('Op welk e-mailadres bereiken we je als een eigenaar past?', 'Which email should we use when an owner fits?', 'Unter welcher E-Mail erreichen wir Sie, wenn ein Inhaber passt?'), b: L('Laatste stap: je e-mailadres. Eigenaren zien het niet.', 'Last step: your email. Owners do not see it.', 'Letzter Schritt: Ihre E-Mail. Inhaber sehen sie nicht.') }, mail: true },
  },
  owners: {
    type: { q: { a: L('Wat overweeg je?', 'What are you considering?', 'Was erwägen Sie?'), b: L('Waar denk je over na?', 'What is on your mind?', 'Worüber denken Sie nach?') }, enum: ['sale', 'succession', 'sale'], uniek: ['sale', 'succession', 'bod'], terug: 'sale',
      lab: t => ({ nl: ['Verkopen, geheel of deels', 'Een opvolger vinden', 'Alleen bij het juiste bod'], en: ['Selling, fully or partly', 'Finding a successor', 'Only for the right offer'], de: ['Verkaufen, ganz oder teilweise', 'Einen Nachfolger finden', 'Nur beim richtigen Angebot'] }[t]) },
    sector: { q: { a: L('In welke sector zit je bedrijf? Alleen grof.', 'Which sector is your business in? Broadly.', 'In welcher Branche ist Ihre Firma? Nur grob.') }, enum: SECTORS, lab: t => LPT[t].opt.sector },
    market: { q: { a: L('Waar mag een koper vandaan komen?', 'Where may a buyer come from?', 'Woher darf ein Käufer kommen?') }, enum: MARKETS, lab: t => LPT[t].opt.market },
    timing: { q: { a: L('Wanneer zou je bewegen?', 'When would you move?', 'Wann würden Sie sich bewegen?') }, terug: 'exploring', enum: TIMES, lab: t => TIJD[t] },
    conditions: { q: { a: L('Onder welke voorwaarden zou je het doen? Kies wat klopt.', 'On what terms would you do it? Pick what applies.', 'Zu welchen Bedingungen würden Sie es tun? Wählen Sie, was zutrifft.'), b: L('Ik zou het doen, mits…', 'I would do it, provided…', 'Ich würde es tun, sofern…') }, multi: true,
      opts: [L('Het team blijft', 'The team stays', 'Das Team bleibt'), L('Ik blijf nog een tijd betrokken', 'I stay involved for a while', 'Ich bleibe noch eine Zeit dabei'), L('Ik kan snel uitstappen', 'I can step out quickly', 'Ich kann schnell ausscheiden'), L('Naam en vestiging blijven', 'Name and site stay', 'Name und Standort bleiben'), L('De prijs ligt boven mijn minimum', 'The price is above my minimum', 'Der Preis liegt über meinem Minimum'), L('Geen doorverkoop binnen drie jaar', 'No resale within three years', 'Kein Weiterverkauf binnen drei Jahren')] },
    dealbreaker: { q: { a: L('En wat is niet bespreekbaar?', 'And what is off the table?', 'Und was ist nicht verhandelbar?') }, multi: true,
      opts: [L('Verhuizen van de vestiging', 'Relocating the site', 'Verlegung des Standorts'), L('Ontslagen', 'Layoffs', 'Entlassungen'), L('Een concurrent als koper', 'A competitor as buyer', 'Ein Wettbewerber als Käufer'), L('Opsplitsen van het bedrijf', 'Breaking up the business', 'Zerschlagung der Firma'), L('Niets, alles is bespreekbaar', 'Nothing, all is open', 'Nichts, alles ist offen')] },
    seal: { q: { a: L('Vastleggen? Zonder naam. Je krijgt een privélink waarmee je alles in één tik verwijdert. We bewaren het 90 dagen.', 'Set it down? No name. You get a private link that deletes everything in one tap. We keep it for 90 days.', 'Festhalten? Ohne Namen. Sie erhalten einen privaten Link, der alles mit einem Tipp löscht. Wir speichern es 90 Tage.'), b: L('Zal ik dit verzegelen? Niemand ziet wie je bent. Bewaartermijn 90 dagen, verwijderen kan altijd.', 'Shall I seal this? Nobody sees who you are. Kept for 90 days, delete any time.', 'Soll ich das versiegeln? Niemand sieht, wer Sie sind. 90 Tage gespeichert, jederzeit löschbar.') }, seal: true,
      lab: t => ({ nl: ['Ja, verzegel het'], en: ['Yes, seal it'], de: ['Ja, versiegeln'] }[t]) },
  },
};
const VOLGORDE = {
  buyers: { a: ['kind', 'sector', 'market', 'size', 'offer', 'value', 'model', 'mail'], b: ['sector', 'size', 'market', 'offer', 'kind', 'value', 'model', 'mail'], c: ['offer', 'sector', 'market', 'size', 'kind', 'mail', 'value', 'model'] },
  owners: { a: ['type', 'sector', 'market', 'timing', 'conditions', 'dealbreaker', 'seal'], b: ['conditions', 'dealbreaker', 'type', 'sector', 'market', 'timing', 'seal'], c: ['type', 'conditions', 'dealbreaker', 'sector', 'timing', 'market', 'seal'] },
};
const OPENER = {
  buyers: { a: L('Een paar tikken. Je betaalt pas voor een introductie die de eigenaar zelf goedkeurt.', 'A few taps. You pay only for an introduction the owner approves.', 'Ein paar Tipps. Sie zahlen erst für eine Vorstellung, der der Inhaber zustimmt.'), b: L('Deze eigenaren adverteren niet. Vertel wat je zoekt, dan benaderen wij ze.', 'These owners do not advertise. Tell us what you want and we approach them.', 'Diese Inhaber inserieren nicht. Sagen Sie, was Sie suchen, dann sprechen wir sie an.') },
  owners: { a: L('Geen naam, geen e-mail. Een paar tikken.', 'No name, no email. A few taps.', 'Kein Name, keine E-Mail. Ein paar Tipps.'), b: L('Niemand weet wie je bent tot jij ja zegt. Het kost je niets.', 'Nobody knows who you are until you say yes. It costs you nothing.', 'Niemand weiß, wer Sie sind, bis Sie Ja sagen. Es kostet Sie nichts.') },
};
export const TEKST = {
  nl: { ok: 'Genoteerd.', kiesDicht: 'Kies hieronder wat het dichtst in de buurt komt.', toel: 'Toelichting', van: 'Van', zoekt: 'Zoekt', biedt: 'Biedt', vw: 'Voorwaarden', bedrijf: 'Bedrijf', anoniem: 'Eigenaar, anoniem', mits: 'Ik zou het doen, mits', linkNoot: 'Dit is je privélink. Bewaar hem: wij kunnen hem niet opnieuw sturen.', waardeZin: 'Een introductie die de eigenaar zelf goedkeurt is je {x} waard.', modelZin: { 'per-intro': 'Je betaalt het liefst een vast bedrag per introductie.', monthly: 'Je betaalt het liefst een vast bedrag per maand.', success: 'Je betaalt het liefst alleen bij een gesloten deal.', mix: 'Je betaalt het liefst een combinatie van vast bedrag en succes.' }, kVw: ['De prijs spreken we met je af voordat we iemand introduceren.', 'Eigenaren zien je criteria, niet je naam of e-mailadres.', 'We bewaren dit maximaal 180 dagen. Eén mail en het is weg.', 'Binnen twee werkdagen hoor je welke eigenaren we voor je kunnen benaderen.'], oVw: ['Niemand ziet wie je bent tot jij per koper ja zegt.', 'Het kost je niets. De koper betaalt.', 'We bewaren dit 90 dagen. Verwijderen kan altijd via je privélink.'], rol: 'Wat ben je?', buyers: 'Ik wil een bedrijf kopen', owners: 'Ik ben eigenaar', verder: 'Verder', ph: 'Of typ het hier', phMail: 'naam@bedrijf.com', stuur: 'Stuur', genoteerd: 'Genoteerd. Kies hieronder wat het dichtst in de buurt komt.', geenContact: 'Laat namen, e-mail en telefoon hier weg. Zo blijf je anoniem.', mailFout: 'Dat lijkt geen e-mailadres.', fout: 'Dat ging niet goed. Probeer het nog een keer.', bezig: 'Even vastleggen…',
    kKlaar: 'Vastgelegd.', kAkkoord: 'Met versturen ga je akkoord dat we dit maximaal 180 dagen bewaren om je te benaderen.', praat: 'Praat direct met Henkjan', lead: 'Ik zou bewegen onder deze voorwaarden', no: 'Niet bespreekbaar', bied: 'Wij bieden',
    oKlaar: 'Verzegeld.', kopieer: 'Kopieer mijn privélink', gekopieerd: 'Gekopieerd', seintje: 'Hoe hoor je het als een koper aan je voorwaarden voldoet?', zelf: 'Ik kijk zelf via mijn link', mailMij: 'Mail me een seintje', seinPh: 'E-mail voor het seintje', seinOk: 'Goed. Je krijgt alleen een seintje, verder niets. Kopers zien dit adres niet.', zelfOk: 'Goed. Kijk af en toe op je privélink.', meer: 'Lees meer' },
  en: { ok: 'Noted.', kiesDicht: 'Pick the closest option below.', toel: 'Note', van: 'From', zoekt: 'Looking for', biedt: 'Offers', vw: 'Terms', bedrijf: 'Business', anoniem: 'Owner, anonymous', mits: 'I would do it, provided', linkNoot: 'This is your private link. Keep it: we cannot send it again.', waardeZin: 'An introduction the owner approves is worth {x} to you.', modelZin: { 'per-intro': 'You would rather pay a fixed amount per introduction.', monthly: 'You would rather pay a fixed amount per month.', success: 'You would rather pay only on a closed deal.', mix: 'You would rather pay a mix of a fixed amount and success.' }, kVw: ['We agree the price with you before we introduce anyone.', 'Owners see your criteria, not your name or email address.', 'We keep this for up to 180 days. One email and it is gone.', 'Within two working days you hear which owners we can approach for you.'], oVw: ['Nobody sees who you are until you say yes, buyer by buyer.', 'It costs you nothing. The buyer pays.', 'We keep this for 90 days. You can delete it any time with your private link.'], rol: 'Which are you?', buyers: 'I want to buy a business', owners: 'I am an owner', verder: 'Continue', ph: 'Or type it here', phMail: 'name@company.com', stuur: 'Send', genoteerd: 'Noted. Pick the closest option below.', geenContact: 'Leave names, email and phone out here. That keeps you anonymous.', mailFout: 'That does not look like an email address.', fout: 'That did not work. Please try again.', bezig: 'Setting it down…',
    kKlaar: 'Set down.', kAkkoord: 'By sending you agree that we keep this for up to 180 days to contact you.', praat: 'Talk to Henkjan now', lead: 'I would move on these terms', no: 'Not negotiable', bied: 'We offer',
    oKlaar: 'Sealed.', kopieer: 'Copy my private link', gekopieerd: 'Copied', seintje: 'How do you want to hear when a buyer meets your terms?', zelf: 'I will check my link myself', mailMij: 'Email me a heads-up', seinPh: 'Email for the heads-up', seinOk: 'Good. You only get a heads-up, nothing else. Buyers do not see this address.', zelfOk: 'Good. Check your private link now and then.', meer: 'Read more' },
  de: { ok: 'Notiert.', kiesDicht: 'Wählen Sie unten, was am nächsten kommt.', toel: 'Anmerkung', van: 'Von', zoekt: 'Sucht', biedt: 'Bietet', vw: 'Bedingungen', bedrijf: 'Unternehmen', anoniem: 'Inhaber, anonym', mits: 'Ich würde es tun, sofern', linkNoot: 'Das ist Ihr privater Link. Bewahren Sie ihn auf: Wir können ihn nicht erneut senden.', waardeZin: 'Eine vom Inhaber bestätigte Vorstellung ist Ihnen {x} wert.', modelZin: { 'per-intro': 'Sie zahlen am liebsten einen festen Betrag je Vorstellung.', monthly: 'Sie zahlen am liebsten einen festen Betrag je Monat.', success: 'Sie zahlen am liebsten nur bei Abschluss.', mix: 'Sie zahlen am liebsten eine Kombination aus Festbetrag und Erfolg.' }, kVw: ['Den Preis vereinbaren wir mit Ihnen, bevor wir jemanden vorstellen.', 'Inhaber sehen Ihre Kriterien, nicht Ihren Namen oder Ihre E-Mail-Adresse.', 'Wir speichern dies bis zu 180 Tage. Eine E-Mail und es ist gelöscht.', 'Innerhalb von zwei Werktagen erfahren Sie, welche Inhaber wir für Sie ansprechen können.'], oVw: ['Niemand sieht, wer Sie sind, bis Sie Käufer für Käufer zustimmen.', 'Es kostet Sie nichts. Der Käufer zahlt.', 'Wir speichern dies 90 Tage. Löschen ist jederzeit über Ihren privaten Link möglich.'], rol: 'Was sind Sie?', buyers: 'Ich möchte ein Unternehmen kaufen', owners: 'Ich bin Inhaber', verder: 'Weiter', ph: 'Oder hier eintippen', phMail: 'name@firma.com', stuur: 'Senden', genoteerd: 'Notiert. Wählen Sie unten, was am nächsten kommt.', geenContact: 'Bitte hier keine Namen, E-Mail oder Telefon. So bleiben Sie anonym.', mailFout: 'Das sieht nicht nach einer E-Mail-Adresse aus.', fout: 'Das hat nicht geklappt. Bitte noch einmal versuchen.', bezig: 'Wird festgehalten…',
    kKlaar: 'Festgehalten.', kAkkoord: 'Mit dem Senden stimmen Sie zu, dass wir dies bis zu 180 Tage speichern, um Sie zu kontaktieren.', praat: 'Jetzt mit Henkjan sprechen', lead: 'Ich würde mich zu diesen Bedingungen bewegen', no: 'Nicht verhandelbar', bied: 'Wir bieten',
    oKlaar: 'Versiegelt.', kopieer: 'Meinen privaten Link kopieren', gekopieerd: 'Kopiert', seintje: 'Wie möchten Sie erfahren, wenn ein Käufer Ihre Bedingungen erfüllt?', zelf: 'Ich schaue selbst über meinen Link', mailMij: 'Schicken Sie mir einen Hinweis', seinPh: 'E-Mail für den Hinweis', seinOk: 'Gut. Sie erhalten nur einen Hinweis, sonst nichts. Käufer sehen diese Adresse nicht.', zelfOk: 'Gut. Schauen Sie gelegentlich auf Ihren privaten Link.', meer: 'Mehr lesen' },
};

const H = 'si:chat:arm', DYN = 'si:chat:dyn', UIT = 'si:chat:uit', PIL = 'si:chat:pil', ALIAS = 'si:chat:alias', NIEUW = 'si:chat:nieuw';
const N = x => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
const dag = () => new Date().toISOString().slice(0, 10);
const armOk = a => /^[a-z0-9]{1,8}$/.test(String(a || ''));
async function hget(kv, k) { const r = await kv.raw(['HGETALL', k]).catch(() => []); const o = {}; if (Array.isArray(r)) for (let i = 0; i < r.length; i += 2) o[r[i]] = N(r[i + 1]); else if (r && typeof r === 'object') for (const [a, b] of Object.entries(r)) o[a] = N(b); return o; }
const inc = (kv, k, f, n = 1) => kv.raw(['HINCRBY', k, f, n]).catch(() => 0);

// Beta-trekking (Thompson) via twee gamma's (Marsaglia en Tsang)
function gamma(k) { if (k < 1) return gamma(k + 1) * Math.pow(Math.random(), 1 / k); const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { const u1 = Math.random() || 1e-9, u2 = Math.random(); x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = Math.random() || 1e-9; if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v; } }
const beta = (a, b) => { const x = gamma(a), y = gamma(b); return x / (x + y); };
function kies(stats, pre, armen) { let best = armen[0], hoog = -1; for (const a of armen) { const n = stats[pre + a + '|n'] || 0, s = Math.min(n, stats[pre + a + '|s'] || 0), t = beta(s + 1, n - s + 1); if (t > hoog) { hoog = t; best = a; } } return best; }

async function staat(kv) { const [stats, dyn, uit, pil] = await Promise.all([hget(kv, H), kv.get(DYN).catch(() => null), kv.raw(['SMEMBERS', UIT]).catch(() => []), kv.get(PIL).catch(() => null)]); return { stats, dyn: dyn && typeof dyn === 'object' ? dyn : {}, uit: new Set(Array.isArray(uit) ? uit : []), pil: pil && typeof pil === 'object' ? pil : {} }; }
// De pills van een stap: vaste keuzes plus wat de chat zelf leerde uit getypte antwoorden (alleen bij stappen met meer keuzes tegelijk).
function pillsVan(S, rol, id, taal) { const st = STAP[rol][id], lab = st.lab ? st.lab(taal) : null;
  if (st.opts) return [...st.opts, ...(S.pil[rol + '|' + id] || [])].map((o, i) => ({ v: 'o' + i, l: o[taal] || o.en, alle: [o.nl, o.en, o.de] }));
  if (st.enum) return st.enum.map((v, i) => ({ v, l: lab[i], u: st.uniek ? st.uniek[i] : v, alle: TALEN.map(t => st.lab(t)[i]) }));
  return lab ? lab.map(l => ({ v: 'ja', l, alle: [l] })) : []; }
function armenVan(S, rol, slot, vast) { const d = (S.dyn[rol + '|' + slot] || []).map(x => x.id); const alle = [...Object.keys(vast), ...d].filter(a => !S.uit.has(rol + '|' + slot + '|' + a)); return alle.length ? alle : [Object.keys(vast)[0]]; }
function tekstVan(S, rol, slot, vast, arm, taal) { if (vast[arm]) return vast[arm][taal] || vast[arm].en; const d = (S.dyn[rol + '|' + slot] || []).find(x => x.id === arm); return d ? (d.t[taal] || d.t.en) : Object.values(vast)[0][taal]; }

// Begin van een gesprek: kies per onderdeel een arm en geef de stappen in de gekozen volgorde en formulering terug.
export async function chatStart(kv, { rol, taal, bot }) {
  if (!ROLLEN.includes(rol)) return null; if (!TALEN.includes(taal)) taal = 'en';
  const S = await staat(kv), pre = rol + '|';
  const open = kies(S.stats, pre + 'open|', armenVan(S, rol, 'open', OPENER[rol]));
  const order = kies(S.stats, pre + 'order|', armenVan(S, rol, 'order', VOLGORDE[rol]));
  const q = {}, stappen = [];
  for (const id of VOLGORDE[rol][order] || VOLGORDE[rol].a) {
    const st = STAP[rol][id], slot = 'q.' + id, arm = kies(S.stats, pre + slot + '|', armenVan(S, rol, slot, st.q)); q[id] = arm;
    stappen.push({ id, d: st.terug || (st.enum === SECTORS ? 'other' : st.enum === MARKETS ? 'worldwide' : ''), q: tekstVan(S, rol, slot, st.q, arm, taal), multi: !!st.multi, mail: !!st.mail, seal: !!st.seal,
      pills: pillsVan(S, rol, id, taal).map(p => ({ v: p.v, l: p.l })) });
  }
  if (!bot) { await inc(kv, H, pre + 'open|' + open + '|n'); await inc(kv, H, pre + 'order|' + order + '|n'); await tel(kv, rol, 'start', 'n'); }
  return { rol, taal, armen: { open, order, q }, opener: tekstVan(S, rol, 'open', OPENER[rol], open, taal), stappen };
}
async function tel(kv, rol, stap, f, kanaal) { const k = 'si:chat:f:' + dag(); await inc(kv, k, rol + '|' + stap + '|' + f); if (kanaal) await inc(kv, k, rol + '|' + stap + '|' + f + '|' + kanaal); kv.raw(['EXPIRE', k, 120 * 86400]).catch(() => {}); }

// Gebeurtenis uit de chat. t: n (stap getoond), s (stap beantwoord), done (alles vastgelegd), sein (seintje gekozen)
export async function chatEv(kv, b) {
  const rol = b.rol, t = b.t, stap = String(b.stap || ''), a = b.armen || {};
  if (!ROLLEN.includes(rol)) return false; const pre = rol + '|';
  const kanaal = ['search', 'ai', 'email', 'paid', 'direct-unknown'].includes(b.kanaal) ? b.kanaal : null;
  if (t === 'done') { if (armOk(a.order)) await inc(kv, H, pre + 'order|' + a.order + '|s'); await tel(kv, rol, 'done', 'n', kanaal); return true; }
  if (t === 'sein') { await tel(kv, rol, 'sein', b.keuze === 'mail' ? 'mail' : 'zelf'); return true; }
  if (!STAP[rol][stap] || (t !== 'n' && t !== 's')) return false;
  const arm = a.q && a.q[stap]; if (armOk(arm)) await inc(kv, H, pre + 'q.' + stap + '|' + arm + '|' + t);
  await tel(kv, rol, stap, t);
  if (t === 's' && b.eerste && armOk(a.open)) await inc(kv, H, pre + 'open|' + a.open + '|s');
  return true;
}

// Wat mensen zelf typen: grondstof voor nieuwe pills en formuleringen. Geen contactgegevens bewaren.
const CONTACT = /https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\+\d{1,3}[ ()-]*)\d[\d ()-]{7,}|\b(?:\d[ .()-]?){10,15}\b/i;
export async function chatVrij(kv, b) {
  const tekst = String(b.tekst || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 200); if (!ROLLEN.includes(b.rol) || !STAP[b.rol][b.stap] || tekst.length < 3 || CONTACT.test(tekst)) return false;
  await kv.raw(['LPUSH', 'si:chat:vrij', JSON.stringify({ r: b.rol, s: b.stap, t: TALEN.includes(b.taal) ? b.taal : 'en', x: tekst, d: dag() })]).catch(() => {}); await kv.raw(['LTRIM', 'si:chat:vrij', 0, 499]).catch(() => {}); return true;
}

// Getypt antwoord naar een pill, met steeds minder AI (Henkjan 16 nov 2026: "Je kunt doordat chat lerend is steeds minder AI gebruiken omdat
// je steeds beter de route kent"). Volgorde: 1) route: dezelfde tekst is al eens opgelost (ALIAS); 2) regel: de woorden komen overeen met een
// pill; 3) AI, één keer per nieuwe tekst en hoogstens AI_PER_DAG keer per dag, en het antwoord wordt onthouden zodat het daarna een route is.
// Wat AI als ontbrekende keuze herkent telt mee in NIEUW; na 3 keer maakt de leerronde er een pill van.
const AI_PER_DAG = 60;
const STOPW = new Set('de het een en of voor met van in op je jij ik mijn bij wat hoe is zijn the a an and or for with of to my our we i is are it der die das ein eine und oder für mit von zu ich mein wir ist sind moet must muss wil want will niet not nicht geen kein no'.split(' '));
const woorden = t => String(t || '').toLowerCase().replace(/[^a-z0-9à-ÿ ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOPW.has(w)).map(w => w.slice(0, 4)); // eerste vier letters: blijft en blijven tellen als hetzelfde woord
export async function chatVraag(kv, b, ai) {
  const rol = b.rol, id = String(b.stap || ''), taal = TALEN.includes(b.taal) ? b.taal : 'en', st = ROLLEN.includes(rol) && STAP[rol][id];
  const tekst = String(b.tekst || '').replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, 200);
  if (!st || st.mail || st.seal || tekst.length < 2 || CONTACT.test(tekst)) return { m: [] };
  await chatVrij(kv, { rol, stap: id, taal, tekst });
  const S = await staat(kv), pills = pillsVan(S, rol, id, taal), w = woorden(tekst), sleutel = rol + '|' + id + '|' + w.join(' ').slice(0, 80);
  const uit = async (idx, bron) => { await tel(kv, 'vrij', bron, 'n'); const zien = st.multi ? idx : idx.slice(0, 1); return { m: zien.filter(i => pills[i]).map(i => ({ v: pills[i].v, l: pills[i].l })), bron }; };
  if (!w.length) return uit([], 'geen');
  const al = await kv.raw(['HGET', ALIAS, sleutel]).catch(() => null);
  if (al != null) { let a = {}; try { a = JSON.parse(al); } catch { a = {}; } if (a && a.n) await inc(kv, NIEUW, a.n); return uit(Array.isArray(a && a.i) ? a.i : [], 'route'); }
  const regel = []; pills.forEach((p, i) => { for (const l of p.alle) { const lw = woorden(l); if (!lw.length) continue; const raak = lw.filter(x => w.includes(x)).length; if (raak / lw.length >= 0.6 || (w.length <= 3 && w.every(x => lw.includes(x)))) { regel.push(i); break; } } });
  if (regel.length) { await kv.raw(['HSET', ALIAS, sleutel, JSON.stringify({ i: regel })]).catch(() => {}); return uit(regel, 'regel'); }
  if (!ai) return uit([], 'geen');
  const dk = 'si:chat:aiv:' + dag(), keer = N(await kv.incr(dk).catch(() => 999)); if (keer === 1) kv.raw(['EXPIRE', dk, 172800]).catch(() => {});
  if (keer > AI_PER_DAG) return uit([], 'geen');
  try {
    const r = await ai({ fn: 'sealed-chat-route', max: 200, timeout: 9000, system: 'A visitor of sealedintent.com typed an answer instead of tapping an option. Map it to the options. Reply with JSON only: {"pick":[option numbers that clearly mean the same, may be empty],"new":null} or, when the text is a clear, reusable answer that no option covers, "new":{"nl":"...","en":"...","de":"..."} as a short neutral option label (max 40 characters, no names, no numbers). Never invent facts.',
      user: JSON.stringify({ question: Object.values(st.q)[0].en, options: pills.map((p, i) => i + ': ' + p.alle[1 % p.alle.length]), typed: tekst }) });
    const j = JSON.parse(String(r.txt || '').replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
    const idx = (Array.isArray(j.pick) ? j.pick : []).map(Number).filter(i => Number.isInteger(i) && pills[i]).slice(0, 4);
    const n = j.new; let nk = null; if (st.opts && n && TALEN.every(t => typeof n[t] === 'string' && n[t].length >= 3 && n[t].length <= 40 && !/[<>{}@\d]/.test(n[t]))) { nk = rol + '|' + id + '|' + n.en.toLowerCase(); await inc(kv, NIEUW, nk); await kv.raw(['HSET', NIEUW + ':t', nk, JSON.stringify({ nl: n.nl, en: n.en, de: n.de })]).catch(() => {}); }
    await kv.raw(['HSET', ALIAS, sleutel, JSON.stringify(nk ? { i: idx, n: nk } : { i: idx })]).catch(() => {});
    return uit(idx, idx.length ? 'ai' : 'ai-geen');
  } catch { return uit([], 'geen'); }
}

export async function chatStand(kv, dagen = 7) {
  const S = await staat(kv), uit = { armen: {}, trechter: {}, uitgezet: [...S.uit], coach: (await kv.raw(['LRANGE', 'si:chat:log', 0, 9]).catch(() => [])) || [] };
  for (const [k, v] of Object.entries(S.stats)) { const [rol, slot, arm, f] = k.split('|'); const o = ((uit.armen[rol + ' ' + slot] = uit.armen[rol + ' ' + slot] || {})[arm] = uit.armen[rol + ' ' + slot][arm] || { n: 0, s: 0 }); o[f] = v; }
  for (const g of Object.values(uit.armen)) for (const o of Object.values(g)) o.pct = o.n ? Math.round(1000 * Math.min(o.s, o.n) / o.n) / 10 : null;
  for (let i = 0; i < dagen; i++) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10), h = await hget(kv, 'si:chat:f:' + d); for (const [k, v] of Object.entries(h)) uit.trechter[k] = (uit.trechter[k] || 0) + v; }
  return uit;
}
export function chatStandTekst(s) {
  const r = ['Sealed Intent chat, laatste 7 dagen', ''];
  for (const rol of ROLLEN) { const t = (k) => s.trechter[rol + '|' + k] || 0; r.push(rol + ': gestart ' + t('start|n') + ', afgerond ' + t('done|n') + (rol === 'owners' ? ', seintje per mail ' + t('sein|mail') + ', kijkt zelf ' + t('sein|zelf') : ''));
    for (const id of Object.keys(STAP[rol])) { const n = t(id + '|n'), a = t(id + '|s'); if (n) r.push('  ' + id + ': getoond ' + n + ', beantwoord ' + a + ' (' + Math.round(100 * a / n) + '%)'); } r.push(''); }
  { const v = k => s.trechter['vrij|' + k + '|n'] || 0, zonder = v('route') + v('regel'), met = v('ai') + v('ai-geen'), tot = zonder + met + v('geen'); if (tot) r.push('Getypte antwoorden: ' + tot + ', opgelost zonder AI ' + zonder + ' (bekende route ' + v('route') + ', woordregel ' + v('regel') + '), met AI ' + met + ', niet thuisgebracht ' + v('geen') + '. Aandeel AI: ' + Math.round(100 * met / tot) + '%', ''); }
  r.push('Armen (getoond, gelukt, %):'); for (const [slot, g] of Object.entries(s.armen)) r.push('  ' + slot + ': ' + Object.entries(g).map(([a, o]) => a + ' ' + o.n + '/' + o.s + (o.pct == null ? '' : ' ' + o.pct + '%')).join(', '));
  if (s.uitgezet.length) r.push('', 'Uitgezet: ' + s.uitgezet.join(', ')); if (s.coach.length) r.push('', 'Coach:', ...s.coach.map(x => '  ' + x));
  return r.join('\n');
}

// Leerronde (cron elk uur). 1) Een arm die na 40 keer tonen in minder dan 3% van de trekkingen de beste is, gaat uit. 2) De coach schrijft één
// nieuwe formulering voor de vraag met de meeste afhakers (minstens 25 keer getoond, hoogstens 5 armen), hoogstens 4 keer per dag.
export async function chatLeer(kv, { ai } = {}) {
  const S = await staat(kv), gedaan = [], groepen = {};
  for (const k of Object.keys(S.stats)) { const [rol, slot, arm] = k.split('|'); if (!S.uit.has(rol + '|' + slot + '|' + arm)) (groepen[rol + '|' + slot] = groepen[rol + '|' + slot] || new Set()).add(arm); }
  for (const [g, set] of Object.entries(groepen)) { const armen = [...set]; if (armen.length < 2) continue; const wint = Object.fromEntries(armen.map(a => [a, 0]));
    for (let i = 0; i < 2000; i++) wint[kies(S.stats, g + '|', armen)]++;
    for (const a of armen) { const n = S.stats[g + '|' + a + '|n'] || 0; if (n >= 40 && wint[a] / 2000 < 0.03 && armen.filter(x => !S.uit.has(g + '|' + x)).length > 1) { await kv.raw(['SADD', UIT, g + '|' + a]).catch(() => {}); S.uit.add(g + '|' + a); gedaan.push('uit: ' + g + ' arm ' + a + ' (' + n + ' getoond, ' + (S.stats[g + '|' + a + '|s'] || 0) + ' gelukt)'); } } }
  const nieuw = await hget(kv, NIEUW);
  for (const [k, n] of Object.entries(nieuw)) { if (n < 3) continue; const [rol, id] = k.split('|'), sk = rol + '|' + id; if (!STAP[rol] || !STAP[rol][id] || !STAP[rol][id].opts || (S.pil[sk] || []).length >= 3) continue;
    let t = null; try { t = JSON.parse(await kv.raw(['HGET', NIEUW + ':t', k])); } catch { t = null; } if (!t || (S.pil[sk] || []).some(x => x.en.toLowerCase() === t.en.toLowerCase())) continue;
    S.pil[sk] = [...(S.pil[sk] || []), t]; await kv.set(PIL, S.pil); await kv.raw(['HDEL', NIEUW, k]).catch(() => {}); gedaan.push('nieuwe pill: ' + sk + ' "' + t.nl + '" (' + n + ' keer getypt)'); }
  let slechtst = null;
  for (const rol of ROLLEN) for (const id of Object.keys(STAP[rol])) { const slot = 'q.' + id, armen = armenVan(S, rol, slot, STAP[rol][id].q); let n = 0, s = 0; for (const a of armen) { n += S.stats[rol + '|' + slot + '|' + a + '|n'] || 0; s += S.stats[rol + '|' + slot + '|' + a + '|s'] || 0; } if (n >= 25 && armen.length < 5) { const p = s / n; if (!slechtst || p < slechtst.p) slechtst = { rol, id, slot, armen, n, s, p }; } }
  if (slechtst && ai) { const dk = 'si:chat:ai:' + dag(), keer = N(await kv.incr(dk).catch(() => 99)); if (keer === 1) kv.raw(['EXPIRE', dk, 172800]).catch(() => {});
    if (keer <= 4) { try {
      const st = STAP[slechtst.rol][slechtst.id], vrij = ((await kv.raw(['LRANGE', 'si:chat:vrij', 0, 199]).catch(() => [])) || []).map(x => { try { return JSON.parse(x); } catch { return null; } }).filter(x => x && x.r === slechtst.rol && x.s === slechtst.id).slice(0, 10).map(x => x.x);
      const nu = slechtst.armen.map(a => ({ arm: a, en: tekstVan(S, slechtst.rol, slechtst.slot, st.q, a, 'en'), shown: S.stats[slechtst.rol + '|' + slechtst.slot + '|' + a + '|n'] || 0, answered: S.stats[slechtst.rol + '|' + slechtst.slot + '|' + a + '|s'] || 0 }));
      const r = await ai({ fn: 'sealed-chat-coach', max: 400, timeout: 20000, system: 'You improve one question in a short pill-based chat on sealedintent.com. ' + (slechtst.rol === 'buyers' ? 'The visitor is a business buyer setting down acquisition criteria.' : 'The visitor is a business owner who is not for sale but would sell on the right terms, and stays anonymous.') + ' The answer options below the question stay the same. Write ONE new wording that more visitors will answer: plain, direct, serious, under 110 characters, no exclamation marks, no promises about buyers, prices or results. Reply with JSON only: {"nl":"...","en":"...","de":"..."} (Dutch informal je, German formal Sie).',
        user: JSON.stringify({ step: slechtst.id, options: (st.opts || []).map(o => o.en), current: nu, typed_by_visitors: vrij }) });
      const j = JSON.parse(String(r.txt || '').replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      if (TALEN.every(t => typeof j[t] === 'string' && j[t].length >= 8 && j[t].length <= 160 && !/[<>{}]/.test(j[t]))) { const sleutel = slechtst.rol + '|' + slechtst.slot, id = 'c' + Date.now().toString(36).slice(-5); S.dyn[sleutel] = [...(S.dyn[sleutel] || []), { id, t: { nl: j.nl, en: j.en, de: j.de }, at: new Date().toISOString() }]; await kv.set(DYN, S.dyn); gedaan.push('nieuw: ' + sleutel + ' arm ' + id + ' "' + j.nl + '" (stap beantwoord door ' + Math.round(100 * slechtst.p) + '% van ' + slechtst.n + ')'); }
    } catch (e) { gedaan.push('coach mislukt: ' + String(e.message || e).slice(0, 80)); } } }
  if (gedaan.length) { for (const g of gedaan) await kv.raw(['LPUSH', 'si:chat:log', new Date().toISOString().slice(0, 16) + ' ' + g]).catch(() => {}); await kv.raw(['LTRIM', 'si:chat:log', 0, 99]).catch(() => {}); }
  return { gedaan, slechtst: slechtst && { rol: slechtst.rol, stap: slechtst.id, pct: Math.round(100 * slechtst.p), n: slechtst.n } };
}

// Draait in de browser. C: { taal, rol (vooraf gekozen of ''), T (teksten), meet (link) }
export function chatBrowser(C) {
  var T = C.T, log = document.getElementById('log'), pills = document.getElementById('pills'), form = document.getElementById('typ'), inp = form.elements.t, S = null, i = 0, ans = {}, lab = {}, vrij = [], sel = [], bezig = false, sein = null;
  function kanaal() { try { return sessionStorage.getItem('si_source_v2') || 'direct-unknown'; } catch (e) { return 'direct-unknown'; } }
  function post(op, b) { return fetch('/api/sealed?op=' + op, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b), keepalive: true }).then(function (r) { return r.json().then(function (j) { j._s = r.status; return j; }); }); }
  function ev(t, stap, x) { var b = { rol: S.rol, t: t, stap: stap, armen: S.armen, kanaal: kanaal() }; if (x) for (var k in x) b[k] = x[k]; post('chatev', b).catch(function () {}); }
  var som = document.getElementById('som');
  function chip(t) { var c = document.createElement('span'); c.className = 'pill aan chip'; c.textContent = t; return c; }
  function rij(label, items, lijstje) { var d = document.createElement('div'); d.className = 'rij'; var b = document.createElement('b'); b.textContent = label; d.appendChild(b); var w = document.createElement(lijstje ? 'ul' : 'div'); (items || []).forEach(function (x) { if (!x) return; if (lijstje) { var li = document.createElement('li'); li.textContent = x; w.appendChild(li); } else w.appendChild(chip(x)); }); d.appendChild(w); log.appendChild(d); }
  function zeg(tekst, wie) { if (wie === 'ik') { som.appendChild(chip(tekst)); return som; } var p = document.createElement('p'); p.className = wie || 'bot'; p.textContent = tekst; log.appendChild(p); p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return p; }
  function pil(tekst, fn, cls) { var b = document.createElement('button'); b.type = 'button'; b.className = 'pill' + (cls ? ' ' + cls : ''); b.textContent = tekst; b.onclick = function () { fn(b); }; pills.appendChild(b); return b; }
  function leeg() { pills.replaceChildren(); }
  function kiesRol() { leeg(); rust(); zeg(T.rol); ROL.forEach(function (r) { pil(T[r], function () { begin(r, T[r]); }); }); inp.placeholder = T.ph; }
  var ROL = ['buyers', 'owners'];
  function begin(rol, label) { if (bezig) return; bezig = true; leeg(); if (label) zeg(label, 'ik');
    post('chatstart', { rol: rol, taal: C.taal }).then(function (j) { bezig = false; if (!j.stappen) throw 0; S = j; i = 0; document.getElementById('kort').textContent = S.opener; toon(); }).catch(function () { bezig = false; zeg(T.fout); kiesRol(); }); }
  function rust() { [].slice.call(log.querySelectorAll('.bot,.noot')).forEach(function (x) { x.remove(); }); }
  function toon(ack) { leeg(); rust(); var st = S.stappen[i]; if (!st) return klaar(); if (ack) zeg(ack, 'noot'); zeg(st.q); ev('n', st.id); inp.type = st.mail ? 'email' : 'text'; inp.placeholder = st.mail ? T.phMail : T.ph; if (st.mail) { zeg(T.kAkkoord, 'noot'); inp.focus(); }
    var gekozen = sel = [];
    st.pills.forEach(function (p) { pil(p.l, function (b) { if (st.multi) { var k = gekozen.indexOf(p.l); if (k < 0) { gekozen.push(p.l); b.classList.add('aan'); } else { gekozen.splice(k, 1); b.classList.remove('aan'); } } else antwoord(st, p.v, p.l); }); });
    if (st.multi) { var br = document.createElement('span'); br.className = 'br'; pills.appendChild(br); }
    if (st.multi) pil(T.verder + ' →', function () { if (gekozen.length) antwoord(st, gekozen.slice(), gekozen.join(', ')); }, 'door'); }
  function antwoord(st, v, l, ack) { ans[st.id] = v; lab[st.id] = l; if (st.multi && Array.isArray(v)) v.forEach(function (x) { zeg(x, 'ik'); }); else zeg(l, 'ik'); ev('s', st.id, { eerste: i === 0 }); i++; toon(ack); }
  function net(x) { x = String(x || '').replace(/[.!\s]+$/, ''); return x.charAt(0).toUpperCase() + x.slice(1); }
  var CONTACT = /https?:\/\/|www\.|[^\s@]+@[^\s@]+\.[^\s@]+|(?:\+\d{1,3}[ ()-]*)\d[\d ()-]{7,}|\b(?:\d[ .()-]?){10,15}\b/i;
  form.onsubmit = function (e) { e.preventDefault(); var t = inp.value.trim(); if (!t || bezig) return;
    if (sein) { if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t)) return zeg(T.mailFout); inp.value = ''; var s = sein; sein = null; form.hidden = true; post('chatsein', { id: s.id, token: s.token, mail: t }).then(function () { zeg(T.seinOk); }).catch(function () { zeg(T.fout); }); ev('sein', '', { keuze: 'mail' }); leeg(); inp.type = 'text'; inp.placeholder = T.ph; return; }
    if (!S) { inp.value = ''; zeg(t, 'ik'); return kiesRol(); }
    var st = S.stappen[i]; if (!st) return;
    if (st.mail) { if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t)) return zeg(T.mailFout); inp.value = ''; return antwoord(st, t, t); }
    if (S.rol === 'owners' && CONTACT.test(t)) { inp.value = ''; return zeg(T.geenContact); }
    inp.value = ''; vrij.push(t); bezig = true;
    function verder(m) { bezig = false; if (st !== S.stappen[i]) return; var ack = net(t) + '. ' + T.ok; if (st.multi) { var alles = sel.slice(); m.forEach(function (x) { if (alles.indexOf(x.l) < 0) alles.push(x.l); }); if (!m.length) alles.push(net(t)); antwoord(st, alles, alles.join(', '), ack); } else if (m.length) antwoord(st, m[0].v, m[0].l, ack); else if (st.d) antwoord(st, st.d, net(t), ack); else { rust(); zeg(ack + ' ' + T.kiesDicht, 'noot'); zeg(st.q); } }
    post('chatvraag', { rol: S.rol, stap: st.id, taal: C.taal, tekst: t }).then(function (j) { verder(j.m || []); }).catch(function () { verder([]); }); };
  function lijst(x) { return Array.isArray(x) ? x.join('; ') : String(x || ''); }
  function klein(x) { x = String(x || ''); return x.charAt(0).toLowerCase() + x.slice(1); }
  function klaar() { leeg(); bezig = true; form.hidden = true; rust(); var wacht = zeg(T.bezig, 'noot');
    if (S.rol === 'buyers') { var crit = [lab.kind, lab.sector, lab.market, lab.size].join(', ') + '. ' + T.bied + ': ' + lijst(ans.offer) + '.' + (vrij.length ? ' ' + vrij.join(' ') : '');
      post('koper', { kind: ans.kind, sector: ans.sector, market: ans.market, size: ans.size, criteria: crit.slice(0, 1200), model: ans.model, value: ans.value, mail: ans.mail, consent: true, language: C.taal, channel: kanaal(), website: '' }).then(function (j) { bezig = false; wacht.remove(); if (!j.ok) throw 0; ev('done', ''); som.replaceChildren(); zeg(T.kKlaar); rij(T.van, [lab.kind, ans.mail]); rij(T.zoekt, [lab.sector, lab.market, 'EBITDA ' + klein(lab.size)]); rij(T.biedt, ans.offer); rij(T.vw, [T.modelZin[ans.model], T.waardeZin.replace('{x}', klein(lab.value))].concat(T.kVw), true); var a = document.createElement('a'); a.className = 'pill'; a.href = C.meet; a.target = '_blank'; a.rel = 'noopener'; a.textContent = T.praat + ' →'; pills.appendChild(a); }).catch(function () { bezig = false; wacht.remove(); form.hidden = false; zeg(T.fout); pil(T.stuur, klaar); }); return; }
    var terms = T.lead + ': ' + lijst(ans.conditions) + '. ' + T.no + ': ' + lijst(ans.dealbreaker) + '.' + (vrij.length ? ' ' + T.toel + ': ' + vrij.join('; ') + '.' : '');
    post('intent', { mode: 'intent', type: ans.type, sector: ans.sector, market: ans.market, timing: ans.timing, terms: terms.slice(0, 1200), consent: true, website: '', language: C.taal, channel: kanaal() }).then(function (j) { bezig = false; wacht.remove(); if (!j.ok) { if (j.error === 'contact-details') { zeg(T.geenContact); } throw 0; } ev('done', '');
      var link = location.origin + '/' + C.taal + '/manage#' + j.id + '.' + j.token; som.replaceChildren(); zeg(T.oKlaar); rij(T.van, [T.anoniem, lab.type]); rij(T.bedrijf, [lab.sector, lab.market, lab.timing]); rij(T.mits, ans.conditions, true); rij(T.no, ans.dealbreaker, true); rij(T.vw, T.oVw, true); zeg(T.linkNoot, 'noot'); var a = document.createElement('a'); a.className = 'link'; a.href = link; a.textContent = link.slice(0, 46) + '…'; log.appendChild(a);
      log.appendChild(pil(T.kopieer, function (b) { try { navigator.clipboard.writeText(link).then(function () { b.textContent = T.gekopieerd; }); } catch (e) { window.prompt(T.kopieer, link); } }));
      zeg(T.seintje); pil(T.zelf, function () { leeg(); zeg(T.zelfOk); ev('sein', '', { keuze: 'zelf' }); sein = null; form.hidden = true; }); pil(T.mailMij, function () { form.hidden = false; sein = { id: j.id, token: j.token }; inp.type = 'email'; inp.placeholder = T.seinPh; inp.focus(); });
    }).catch(function () { bezig = false; if (wacht.parentNode) wacht.remove(); form.hidden = false; zeg(T.fout); pil(T.stuur, klaar); }); }
  if (C.rol) begin(C.rol, ''); else kiesRol();
}
