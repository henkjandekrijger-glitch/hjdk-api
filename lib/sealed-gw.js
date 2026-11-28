// Sealed Intent: één ingang voor elke intentie, beide kanten op (Henkjan 27 nov 2026: "Ja bouw . En neem deze ux die is heel clean .
// Neem browser gegevens ed mee dan weet je ongeveer waar iemand zit en alles moet lerend zijn en de chat altijd echt intelligent ." en
// "demand moet borg betalen"). Ontwerp: https://claude.ai/artifact/2DP54NnYTjLKk9D5NB4SUD
//
// Pagina /<taal>/start (nl, en, de), statuskaart /<taal>/k?i=<id>&s=<sleutel>.
// POST /?op=gw: één stap van de chat (AI maakt antwoord, vraag, pills en de kaart), of een actie (kies, beide, trek).
// GET  /?op=gwstand: trechter van 7 dagen, wat er geleerd is, de laatste kaarten (zonder contact).
// GET  /?op=gwproef (alleen beschermde host): de controle; speelt drie gesprekken (fulfilment, klanten zoeken, complexe juridische zaak)
//      tegen de echte AI en meldt of elke beurt een vraag met pills of een kaart gaf.
//
// Lerend: (1) de openingspills staan op volgorde van tikken per keer getoond, met wat ruis zodat nieuwe pills ook kansen krijgen;
// (2) elk antwoord per soort aanvraag en per vraag telt mee (gw:leer:<soort>) en gaat als eerder_gekozen mee naar de AI, zodat de
// pills de keuzes van eerdere bezoekers volgen; (3) de trechter per dag (gw:stat:<dag>) toont waar mensen afhaken.
// Borg: alleen de vraagkant (richting zoekt), als vooruitbetaald matchgeld. Tijdens de proef wordt nog niets afgeschreven
// en gaat er geen mail naar bedrijven: Henkjan zet een kaart zelf uit (mail naar mensen = zijn ja).
import { createHash, randomBytes } from 'node:crypto';

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dag = () => new Date().toISOString().slice(0, 10);
const hash = s => createHash('sha256').update(String(s)).digest('hex');
const slug = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'overig';
const geenContact = s => String(s == null ? '' : s).replace(/[^\s@]+@[^\s@]+\.[a-z]{2,}/gi, '[verborgen]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[verborgen]').slice(0, 400);
export const BORG = { klein: 25, middel: 75, groot: 250 };
export const MAX_VRAGEN = 6;
export const TALEN = ['nl', 'en', 'de'];

const T = {
  nl: { titel: 'Wat zoek je, of wat heb je?', lead: 'Zeg het in een paar tikken. Wij brengen het verzegeld bij de juiste partijen. Contact pas na twee keer ja.', site: 'Website van je bedrijf (hoeft niet)', typ: 'Of typ het zelf', stuur: 'Verstuur', klaarKnop: 'Klaar', ongeveer: 'ongeveer',
    open: ['Leverancier zoeken', 'Klanten zoeken', 'Bedrijf kopen of verkopen', 'Advocaat of financier', 'Partner of investeerder', 'Een rol of interim', 'Een behandeling', 'Iets anders'],
    kaart: 'Je verzegelde kaart', anoniem: 'zonder naam', rijen: { zoekt: 'Zoekt', biedt: 'Biedt', waar: 'Waar', wanneer: 'Wanneer', budget: 'Budget', mits: 'Mits', niet: 'Niet onderhandelbaar', partijen: 'Partijen' },
    regel: 'Geen naam, geen website, geen contact. Na 7 dagen vervalt de kaart, tenzij je je voorwaarden laat staan.',
    mail: 'Waar laten we weten dat er antwoord is?', mailPh: 'je@bedrijf.nl', mailUitleg: 'Dit adres ziet niemand. Alleen voor jouw berichten.',
    uitzet: b => 'Zet uit naar passende partijen (borg €' + b + ')', uitzetH: 'Zet uit naar passende partijen', staan: 'Laat mijn voorwaarden staan',
    borgUitleg: b => 'De borg van €' + b + ' is vooruitbetaald matchgeld. Bij een match telt hij mee. Komt er geen passend aanbod, dan krijg je hem terug. Reageer je niet op wat binnenkomt, dan betaalt hij de tijd van de aanbieders.',
    beide: b => 'Uit je website: ' + b + ' Mogen we je ook anoniem voorstellen als iemand dat zoekt?', ja: 'Ja, stel ons voor', nee: 'Nee',
    klaarUitzet: 'Je kaart staat klaar om uit te zetten. Tijdens deze proef zet Henkjan hem zelf uit en wordt de borg nog niet afgeschreven.',
    klaarStaan: 'Je voorwaarden staan. Je hoort alleen iets als een aanbod erboven zit.', statusLink: 'Je statuskaart', bewaar: 'Bewaar deze link: alleen jij kunt hem openen.',
    fout: 'Even geen verbinding. Probeer het nog eens.', denk: 'Even denken',
    net: n => n + (n === 1 ? ' kaart in het netwerk past al bij die van jou.' : ' kaarten in het netwerk passen al bij die van jou.'),
    st: { titel: 'Statuskaart', uitgezet: 'Klaar om uit te zetten', staan: 'Voorwaarden staan', ingetrokken: 'Ingetrokken', status: 'Stand', trek: 'Trek in', getrokken: 'Je kaart is ingetrokken.', nietGevonden: 'Deze link klopt niet of is verlopen.' },
    meta: 'Sealed Intent: zeg wat je zoekt of wat je hebt, wij brengen het verzegeld bij de juiste partijen.' },
  en: { titel: 'What are you looking for, or what do you have?', lead: 'Say it in a few taps. We bring it, sealed, to the right parties. Contact only after two yeses.', site: 'Your company website (optional)', typ: 'Or type it yourself', stuur: 'Send', klaarKnop: 'Done', ongeveer: 'approximately',
    open: ['Find a supplier', 'Find customers', 'Buy or sell a company', 'Lawyer or funder', 'Partner or investor', 'A role or interim', 'A treatment', 'Something else'],
    kaart: 'Your sealed card', anoniem: 'no name', rijen: { zoekt: 'Seeks', biedt: 'Offers', waar: 'Where', wanneer: 'When', budget: 'Budget', mits: 'Provided', niet: 'Non-negotiable', partijen: 'Parties' },
    regel: 'No name, no website, no contact. The card expires after 7 days unless you keep your terms standing.',
    mail: 'Where should we tell you there is a reply?', mailPh: 'you@company.com', mailUitleg: 'Nobody sees this address. Only for your messages.',
    uitzet: b => 'Send to matching parties (deposit €' + b + ')', uitzetH: 'Send to matching parties', staan: 'Keep my terms standing',
    borgUitleg: b => 'The €' + b + ' deposit is prepaid match fee. On a match it counts towards it. If no fitting offer comes, you get it back. If you do not respond to what comes in, it pays for the suppliers’ time.',
    beide: b => 'From your website: ' + b + ' May we also introduce you anonymously when someone looks for that?', ja: 'Yes, introduce us', nee: 'No',
    klaarUitzet: 'Your card is ready to go out. During this pilot Henkjan sends it himself and the deposit is not charged yet.',
    klaarStaan: 'Your terms are standing. You only hear from us when an offer clears them.', statusLink: 'Your status card', bewaar: 'Keep this link: only you can open it.',
    fout: 'No connection for a moment. Please try again.', denk: 'Thinking',
    net: n => n + (n === 1 ? ' card in the network already fits yours.' : ' cards in the network already fit yours.'),
    st: { titel: 'Status card', uitgezet: 'Ready to send', staan: 'Terms standing', ingetrokken: 'Withdrawn', status: 'Status', trek: 'Withdraw', getrokken: 'Your card is withdrawn.', nietGevonden: 'This link is not valid or has expired.' },
    meta: 'Sealed Intent: say what you seek or what you have, we bring it sealed to the right parties.' },
  de: { titel: 'Was suchen Sie, oder was haben Sie?', lead: 'Sagen Sie es mit ein paar Tipps. Wir bringen es versiegelt zu den richtigen Parteien. Kontakt erst nach zweimal Ja.', site: 'Website Ihres Unternehmens (optional)', typ: 'Oder selbst tippen', stuur: 'Senden', klaarKnop: 'Fertig', ongeveer: 'ungefähr',
    open: ['Lieferant finden', 'Kunden finden', 'Firma kaufen oder verkaufen', 'Anwalt oder Finanzierer', 'Partner oder Investor', 'Eine Rolle oder Interim', 'Eine Behandlung', 'Etwas anderes'],
    kaart: 'Ihre versiegelte Karte', anoniem: 'ohne Namen', rijen: { zoekt: 'Sucht', biedt: 'Bietet', waar: 'Wo', wanneer: 'Wann', budget: 'Budget', mits: 'Sofern', niet: 'Nicht verhandelbar', partijen: 'Parteien' },
    regel: 'Kein Name, keine Website, kein Kontakt. Nach 7 Tagen verfällt die Karte, außer Sie lassen Ihre Bedingungen stehen.',
    mail: 'Wohin melden wir, dass es eine Antwort gibt?', mailPh: 'sie@firma.de', mailUitleg: 'Diese Adresse sieht niemand. Nur für Ihre Nachrichten.',
    uitzet: b => 'An passende Parteien senden (Kaution €' + b + ')', uitzetH: 'An passende Parteien senden', staan: 'Meine Bedingungen stehen lassen',
    borgUitleg: b => 'Die Kaution von €' + b + ' ist vorausbezahlte Vermittlungsgebühr. Bei einem Match wird sie angerechnet. Kommt kein passendes Angebot, erhalten Sie sie zurück. Reagieren Sie nicht auf Angebote, bezahlt sie die Zeit der Anbieter.',
    beide: b => 'Von Ihrer Website: ' + b + ' Dürfen wir Sie auch anonym vorstellen, wenn jemand das sucht?', ja: 'Ja, gern', nee: 'Nein',
    klaarUitzet: 'Ihre Karte ist bereit. In diesem Pilot versendet Henkjan sie selbst und die Kaution wird noch nicht abgebucht.',
    klaarStaan: 'Ihre Bedingungen stehen. Sie hören nur von uns, wenn ein Angebot darüber liegt.', statusLink: 'Ihre Statuskarte', bewaar: 'Bewahren Sie diesen Link auf: nur Sie können ihn öffnen.',
    fout: 'Gerade keine Verbindung. Bitte noch einmal versuchen.', denk: 'Einen Moment',
    net: n => n + (n === 1 ? ' Karte im Netzwerk passt schon zu Ihrer.' : ' Karten im Netzwerk passen schon zu Ihrer.'),
    st: { titel: 'Statuskarte', uitgezet: 'Bereit zum Versenden', staan: 'Bedingungen stehen', ingetrokken: 'Zurückgezogen', status: 'Stand', trek: 'Zurückziehen', getrokken: 'Ihre Karte ist zurückgezogen.', nietGevonden: 'Dieser Link ist ungültig oder abgelaufen.' },
    meta: 'Sealed Intent: sagen Sie, was Sie suchen oder haben, wir bringen es versiegelt zu den richtigen Parteien.' }
};

// Reserve als de AI niet antwoordt: de chat loopt nooit vast (CLAUDE.md "Nooit vastlopen").
const RESERVE = {
  nl: [['wat', 'Wat zoek of bied je precies?', ['Een dienst', 'Een product', 'Een bedrijf', 'Een persoon']], ['omvang', 'Hoe groot is het ongeveer?', ['Klein', 'Middel', 'Groot', 'Weet ik niet']], ['waar', 'Waar moet het zijn?', ['In de buurt', 'In Nederland', 'Maakt niet uit']], ['wanneer', 'Wanneer?', ['Zo snel mogelijk', 'Binnen 3 maanden', 'Geen haast']], ['eis', 'Wat is een harde eis?', ['Vaste prijs', 'Snelheid', 'Kwaliteit', 'Ervaring']]],
  en: [['wat', 'What exactly do you seek or offer?', ['A service', 'A product', 'A company', 'A person']], ['omvang', 'Roughly how big is it?', ['Small', 'Medium', 'Large', 'Not sure']], ['waar', 'Where should it be?', ['Nearby', 'In my country', 'Anywhere']], ['wanneer', 'When?', ['As soon as possible', 'Within 3 months', 'No rush']], ['eis', 'What is a hard requirement?', ['Fixed price', 'Speed', 'Quality', 'Experience']]],
  de: [['wat', 'Was genau suchen oder bieten Sie?', ['Eine Dienstleistung', 'Ein Produkt', 'Eine Firma', 'Eine Person']], ['omvang', 'Wie groß ungefähr?', ['Klein', 'Mittel', 'Groß', 'Weiß nicht']], ['waar', 'Wo soll es sein?', ['In der Nähe', 'Im Inland', 'Egal']], ['wanneer', 'Wann?', ['So bald wie möglich', 'In 3 Monaten', 'Keine Eile']], ['eis', 'Was ist eine harte Anforderung?', ['Festpreis', 'Tempo', 'Qualität', 'Erfahrung']]]
};

export const SYS = `Je bent de chat van Sealed Intent: een eerlijke middleman tussen bedrijven (en straks ook consumenten). Iemand zegt wat hij zoekt of wat hij heeft. Jij maakt daar met zo min mogelijk vragen een verzegelde kaart van, die anoniem naar passende partijen gaat. Contact volgt pas na twee keer ja. Wie iets zoekt betaalt een borg als vooruitbetaald matchgeld; wie gevraagd wordt betaalt nooit.

Regels:
- Antwoord altijd in de taal van de bezoeker (veld taal). Korte zinnen, gewone woorden, geen jargon, geen gedachtestreepjes, geen emoji.
- Elke beurt: "zeg" is één tot drie zinnen met iets echts dat helpt: een eerlijk antwoord, een inzicht of wat vaak misgaat bij dit soort aanvraag. Geen beloftes, geen verzonnen cijfers, geen namen van bedrijven. Weet je iets niet zeker, zeg dat.
- Daarna hoogstens één vraag met 2 tot 6 pills van hoogstens 4 woorden, die de bezoeker kan tikken. Zet "meer" op true als meerdere antwoorden tegelijk logisch zijn. "Weet ik niet" mag als dat eerlijk is.
- Vraag alleen wat de matching beter maakt: wat precies, voor wie, hoeveel of hoe groot, waar, wanneer, budget of prijs, de harde eis; bij complexe zaken ook welke partijen nodig zijn, in welke fase de zaak is en wat het eerste obstakel is. Vraag nooit naar naam, telefoon of e-mail.
- Gebruik de context: plaats bij benadering, taal, de website van de bezoeker (wat het bedrijf levert) en eerder_gekozen (wat eerdere bezoekers bij dit soort aanvraag kozen; gebruik dat voor betere pills). Vraag niets waarvan het antwoord al in de context of het gesprek staat. Typt iemand een lang verhaal, haal er dan zelf alles uit en vraag alleen wat ontbreekt.
- Richting: "zoekt" als de bezoeker iets wil kopen, inhuren of vinden; "heeft" als hij iets aanbiedt of klanten, kopers of opdrachten zoekt.
- Hoogstens het aantal vragen in max_vragen. Is de kaart goed genoeg om partijen te benaderen, zet dan klaar op true, stel geen vraag meer en vat in "zeg" in één zin samen wat er op de kaart staat. Zeg nooit dat de kaart al verstuurd wordt of dat partijen al benaderd worden: de bezoeker kiest daarna zelf of hij hem uitzet of zijn voorwaarden laat staan.
- Complexe zaken (juridisch, overname, medisch): partijen kunnen meerdere soorten zijn, bijvoorbeeld advocaat en procesfinancier. Zet fase en obstakels in "mits". Geef geen juridisch of medisch advies, alleen algemene feiten.
- Bemiddeling in leningen, beleggingen of verzekeringen doen we nog niet: zeg dat in "let_op".
- Nooit contactgegevens in de kaart.
- waarde: "klein" (tot ongeveer 5.000 euro per opdracht), "middel" (tot 50.000), "groot" (meer).

Antwoord alleen met één JSON-object, zonder tekst eromheen:
{"zeg":"","vraag":"","sleutel":"","pills":[],"meer":false,"klaar":false,"bedrijf":"","let_op":"","kaart":{"richting":"zoekt","soort":"","titel":"","zoekt":"","biedt":"","waar":"","wanneer":"","budget":"","mits":"","niet":"","partijen":[],"waarde":"klein"}}
"sleutel" is een kort woord voor de vraag (bijv. volume, regio, start). "kaart" vul je elke beurt bij met alles wat je nu weet; onbekend blijft leeg. "soort" is een korte algemene naam (bijv. fulfilment, bedrijfsovername, advocaat en procesfinancier, ooglidcorrectie). "titel" is één regel van hoogstens 8 woorden zonder namen. "bedrijf" is één zin over wat het bedrijf van de bezoeker levert, alleen als er een website in de context staat.`;

// ---------- context uit de browser en de server ----------
export function geoUit(req) {
  const h = req && req.headers || {};
  let stad = ''; try { stad = decodeURIComponent(String(h['x-vercel-ip-city'] || '')); } catch (e) { stad = String(h['x-vercel-ip-city'] || ''); }
  return { stad: stad.slice(0, 60), land: String(h['x-vercel-ip-country'] || '').slice(0, 2).toUpperCase(), regio: String(h['x-vercel-ip-country-region'] || '').slice(0, 10) };
}
const LAND = { NL: { nl: 'Nederland', en: 'the Netherlands', de: 'Niederlande' }, BE: { nl: 'België', en: 'Belgium', de: 'Belgien' }, DE: { nl: 'Duitsland', en: 'Germany', de: 'Deutschland' }, US: { nl: 'Verenigde Staten', en: 'United States', de: 'USA' }, GB: { nl: 'Verenigd Koninkrijk', en: 'United Kingdom', de: 'Großbritannien' }, CW: { nl: 'Curaçao', en: 'Curaçao', de: 'Curaçao' } };
const landNaam = (c, taal) => (LAND[c] && LAND[c][taal]) || c || '';

async function leesSite(website) {
  let u = String(website || '').trim().toLowerCase(); if (!u) return null;
  if (!/^https?:\/\//.test(u)) u = 'https://' + u;
  let host = ''; try { host = new URL(u).hostname; } catch (e) { return null; }
  if (!/\./.test(host) || /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/.test(host) || /^\d+\.\d+\.\d+\.\d+$/.test(host) || /\.(local|internal)$/.test(host)) return null;
  try {
    const r = await fetch('https://' + host + '/', { redirect: 'follow', signal: AbortSignal.timeout(4000), headers: { 'user-agent': 'SealedIntentBot/1.0 (+https://sealedintent.com)' } });
    const html = (await r.text()).slice(0, 200000);
    const titel = ((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '').trim();
    const desc = ((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || '').trim();
    const tekst = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<noscript[\s\S]*?<\/noscript>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    return { host, titel: titel.slice(0, 160), desc: desc.slice(0, 300), tekst: tekst.slice(0, 2500) };
  } catch (e) { return { host, titel: '', desc: '', tekst: '' }; }
}

// ---------- leren ----------
async function tel(kv, veld, n = 1) { try { await kv.raw(['HINCRBY', 'gw:stat:' + dag(), veld, n]); await kv.raw(['EXPIRE', 'gw:stat:' + dag(), 60 * 86400]); } catch (e) {} }
export async function openPills(kv, taal) {
  const lijst = T[taal].open; let telling = {};
  try { const r = await kv.raw(['HGETALL', 'gw:open:' + taal]); for (let i = 0; i < r.length; i += 2) telling[r[i]] = Number(r[i + 1]) || 0; } catch (e) {}
  const score = p => { const tik = telling['t|' + p] || 0, toon = telling['s|' + p] || 0; return (tik + 1) / (toon + 2) + Math.random() * 0.15; };
  const laatste = lijst[lijst.length - 1]; // 'Iets anders' blijft achteraan
  return lijst.slice(0, -1).map(p => [p, score(p)]).sort((a, b) => b[1] - a[1]).map(x => x[0]).concat(laatste);
}
async function telOpen(kv, taal, getoond, getikt) {
  try { const args = ['HINCRBY', 'gw:open:' + taal]; for (const p of getoond || []) await kv.raw([...args, 's|' + String(p).slice(0, 40), 1]); if (getikt) await kv.raw([...args, 't|' + String(getikt).slice(0, 40), 1]); } catch (e) {}
}
async function eerder(kv, soort) {
  if (!soort) return [];
  try { const r = await kv.raw(['HGETALL', 'gw:leer:' + slug(soort)]); const l = []; for (let i = 0; i < r.length; i += 2) l.push([r[i], Number(r[i + 1]) || 0]); return l.sort((a, b) => b[1] - a[1]).slice(0, 24).map(([k, n]) => k + ' (' + n + 'x)'); } catch (e) { return []; }
}
async function leer(kv, soort, sleutel, keuze) {
  if (!soort || !sleutel || !keuze || !keuze.length) return;
  try { for (const k of keuze.slice(0, 6)) { await kv.raw(['HINCRBY', 'gw:leer:' + slug(soort), String(sleutel).slice(0, 30) + ': ' + String(k).slice(0, 40), 1]); } await kv.raw(['EXPIRE', 'gw:leer:' + slug(soort), 120 * 86400]); } catch (e) {}
}

// ---------- AI ----------
export function leesJson(txt) {
  const s = String(txt || ''); const a = s.indexOf('{'), b = s.lastIndexOf('}'); if (a < 0 || b <= a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}
function schoonAntwoord(j, n) {
  const k = j && typeof j.kaart === 'object' && j.kaart ? j.kaart : {};
  const kaart = {}; for (const f of ['richting', 'soort', 'titel', 'zoekt', 'biedt', 'waar', 'wanneer', 'budget', 'mits', 'niet', 'waarde']) kaart[f] = geenContact(k[f] || '').slice(0, f === 'titel' ? 90 : 300);
  kaart.richting = kaart.richting === 'heeft' ? 'heeft' : 'zoekt'; kaart.waarde = BORG[kaart.waarde] ? kaart.waarde : 'klein';
  kaart.partijen = Array.isArray(k.partijen) ? k.partijen.slice(0, 4).map(x => geenContact(x).slice(0, 40)) : [];
  const pills = Array.isArray(j.pills) ? j.pills.map(p => String(p).slice(0, 40)).filter(Boolean).slice(0, 6) : [];
  const klaar = !!j.klaar || n >= MAX_VRAGEN || !String(j.vraag || '').trim() || !pills.length;
  return { zeg: geenContact(j.zeg || '').slice(0, 500), vraag: klaar ? '' : String(j.vraag || '').slice(0, 200), sleutel: String(j.sleutel || 'vraag' + n).slice(0, 30), pills: klaar ? [] : pills, meer: !!j.meer && !klaar, klaar, bedrijf: geenContact(j.bedrijf || '').slice(0, 220), let_op: String(j.let_op || '').slice(0, 240), kaart };
}
async function vraagAi(ai, invoer) {
  const user = JSON.stringify(invoer);
  for (const model of ['sonnet', 'haiku']) {
    try { const r = await ai({ fn: 'sealed-gw', system: SYS, user, max: 900, timeout: model === 'sonnet' ? 22000 : 12000, model }); const j = leesJson(r && r.txt); if (j) return j; } catch (e) {}
  }
  return null;
}
function reserve(taal, n, kaart) {
  const r = RESERVE[taal] || RESERVE.nl, x = r[Math.min(n, r.length) - 1];
  if (!x) return { zeg: '', vraag: '', sleutel: '', pills: [], meer: false, klaar: true, bedrijf: '', let_op: '', kaart };
  return { zeg: '', vraag: x[1], sleutel: x[0], pills: x[2], meer: false, klaar: false, bedrijf: '', let_op: '', kaart };
}

// ---------- één stap ----------
// b: { sid, taal, tekst, keuze: [..], website, ctx: { tz, lang, ref, utm, scherm }, actie, open: [getoonde openingspills] }
export async function gwStap(kv, b, req, { ai, meld } = {}) {
  const taal = TALEN.includes(b.taal) ? b.taal : 'nl';
  let sid = /^[a-f0-9]{24}$/.test(String(b.sid || '')) ? b.sid : '';
  let s = sid ? await kv.get('gw:s:' + sid).catch(() => null) : null;
  if (!s) { sid = randomBytes(12).toString('hex'); s = { taal, at: new Date().toISOString(), geo: geoUit(req), ctx: {}, stappen: [], kaart: { richting: 'zoekt' }, n: 0, sleutel: '' }; await tel(kv, 'start'); }
  if (b.actie) return gwActie(kv, sid, s, b, { meld });
  if (s.n >= MAX_VRAGEN + 2) return { ok: false, sid, fout: 'te lang' };
  const c = b.ctx && typeof b.ctx === 'object' ? b.ctx : {};
  s.ctx = { tz: String(c.tz || s.ctx.tz || '').slice(0, 40), lang: String(c.lang || s.ctx.lang || '').slice(0, 20), ref: String(c.ref || s.ctx.ref || '').slice(0, 120), utm: String(c.utm || s.ctx.utm || '').slice(0, 120) };
  if (b.website && !s.site) { s.site = await leesSite(b.website); if (s.site) await tel(kv, 'site'); }
  const keuze = Array.isArray(b.keuze) ? b.keuze.map(x => String(x).slice(0, 60)).filter(Boolean).slice(0, 6) : [];
  const tekst = geenContact(String(b.tekst || '').slice(0, 4000));
  const zei = [keuze.join(', '), tekst].filter(Boolean).join('. ');
  if (!zei) return { ok: false, sid, fout: 'leeg' };
  if (s.n === 0) await telOpen(kv, taal, b.open, keuze[0]);
  else await leer(kv, s.kaart.soort, s.sleutel, keuze);
  s.stappen.push({ wie: 'bezoeker', zei });
  s.n += 1; await tel(kv, 'stap' + Math.min(s.n, 9));
  const invoer = { taal, max_vragen: MAX_VRAGEN, vraag_nummer: s.n,
    context: { plaats_bij_benadering: [s.geo.stad, landNaam(s.geo.land, taal)].filter(Boolean).join(', '), browsertaal: s.ctx.lang, tijdzone: s.ctx.tz, kwam_van: s.ctx.ref, campagne: s.ctx.utm, website: s.site ? { adres: s.site.host, titel: s.site.titel, omschrijving: s.site.desc, tekst: s.site.tekst } : null },
    eerder_gekozen: await eerder(kv, s.kaart.soort), kaart_tot_nu: s.kaart, gesprek: s.stappen.slice(-12) };
  const j = ai ? await vraagAi(ai, invoer) : null;
  const a = j ? schoonAntwoord(j, s.n) : reserve(taal, s.n, s.kaart);
  if (!j) await tel(kv, 'reserve');
  for (const [k, v] of Object.entries(a.kaart || {})) { if (Array.isArray(v) ? v.length : v) s.kaart[k] = v; }
  s.sleutel = a.sleutel; if (a.bedrijf) s.bedrijf = a.bedrijf;
  s.stappen.push({ wie: 'chat', zei: [a.zeg, a.vraag].filter(Boolean).join(' '), pills: a.pills });
  if (a.klaar) { s.klaar = true; await tel(kv, 'kaart'); }
  await kv.set('gw:s:' + sid, s, { ex: 7 * 86400 });
  const borg = s.kaart.richting === 'zoekt' ? BORG[s.kaart.waarde] || BORG.klein : 0;
  return { ok: true, sid, zeg: a.zeg, vraag: a.vraag, pills: a.pills, meer: a.meer, klaar: a.klaar, let_op: a.let_op, kaart: s.kaart, borg, bedrijf: a.klaar && s.site ? s.bedrijf || '' : '', ai: !!j };
}

// ---------- kaart bewaren en het netwerk ----------
const woorden = k => new Set(String([k.soort, k.titel, k.zoekt, k.biedt, (k.partijen || []).join(' ')].join(' ')).toLowerCase().split(/[^a-zà-ÿ0-9]+/).filter(w => w.length > 3));
async function netwerk(kv, id, k) {
  const ids = await kv.raw(['LRANGE', 'gw:lijst', 0, 299]).catch(() => []), recs = ids.length ? await kv.mget(...ids.map(i => 'gw:k:' + i)) : [];
  const mij = woorden(k), hits = [];
  for (const r of recs) { if (!r || r.id === id || r.status === 'ingetrokken' || r.kaart.richting === k.richting) continue; let n = 0; for (const w of woorden(r.kaart)) if (mij.has(w)) n++; if (n >= 2) hits.push(r.id); }
  for (const h of hits.slice(0, 20)) { const r = await kv.get('gw:k:' + h).catch(() => null); if (r) { r.netwerk = [...new Set([...(r.netwerk || []), id])].slice(0, 50); await kv.set('gw:k:' + h, r, { ex: 60 * 86400 }); } }
  return hits.slice(0, 20);
}
async function bewaar(kv, s, richtingKaart, status, mail, meld) {
  const id = randomBytes(8).toString('hex'), sleutel = randomBytes(12).toString('hex');
  const kaart = { ...richtingKaart }; for (const f of Object.keys(kaart)) if (typeof kaart[f] === 'string') kaart[f] = geenContact(kaart[f]);
  const rec = { id, taal: s.taal, at: new Date().toISOString(), kaart, status, borg: kaart.richting === 'zoekt' ? BORG[kaart.waarde] || BORG.klein : 0, plaats: [s.geo.stad, s.geo.land].filter(Boolean).join(', '), sHash: hash(sleutel), netwerk: [] };
  rec.netwerk = await netwerk(kv, id, kaart);
  await kv.set('gw:k:' + id, rec, { ex: 60 * 86400 });
  await kv.raw(['LPUSH', 'gw:lijst', id]).catch(() => {}); await kv.raw(['LTRIM', 'gw:lijst', 0, 999]).catch(() => {});
  if (mail) await kv.set('gw:km:' + id, { mail, at: rec.at }, { ex: 60 * 86400 });
  if (meld) { try { await meld('Nieuwe kaart (' + rec.kaart.richting + ', ' + (rec.kaart.soort || 'onbekend') + '): ' + (rec.kaart.titel || '') + '. Stand: ' + status + (rec.netwerk.length ? '. Past bij ' + rec.netwerk.length + ' kaart(en) in het netwerk.' : '') + ' Overzicht: https://hjdk-api-henq.vercel.app/api/sealed?op=gwstand'); } catch (e) {} }
  return { id, sleutel, rec };
}
async function gwActie(kv, sid, s, b, { meld }) {
  const taal = TALEN.includes(s.taal) ? s.taal : 'nl';
  if (b.actie === 'kies') {
    if (!s.klaar) return { ok: false, sid, fout: 'nog niet klaar' };
    const mail = String(b.mail || '').trim().toLowerCase().slice(0, 160), mailOk = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(mail);
    const status = b.keuze === 'uitzetten' ? 'uitgezet' : 'staan';
    if (s.kid) return { ok: true, sid, link: '/' + taal + '/k?i=' + s.kid + '&s=' + s.ksleutel, netwerk: s.knet || 0, status };
    const { id, sleutel, rec } = await bewaar(kv, s, s.kaart, status, mailOk ? mail : '', meld);
    s.kid = id; s.ksleutel = sleutel; s.knet = rec.netwerk.length; await kv.set('gw:s:' + sid, s, { ex: 7 * 86400 });
    await tel(kv, status === 'uitgezet' ? 'uitzet' : 'staan'); if (mailOk) await tel(kv, 'mail');
    return { ok: true, sid, link: '/' + taal + '/k?i=' + id + '&s=' + sleutel, netwerk: rec.netwerk.length, status };
  }
  if (b.actie === 'beide') {
    if (!s.klaar || !s.bedrijf || s.beide) return { ok: true, sid };
    s.beide = true; await kv.set('gw:s:' + sid, s, { ex: 7 * 86400 });
    if (b.ja === true) { await bewaar(kv, s, { richting: 'heeft', soort: 'aanbod', titel: s.bedrijf.slice(0, 90), zoekt: '', biedt: s.bedrijf, waar: [s.geo.stad, landNaam(s.geo.land, 'nl')].filter(Boolean).join(', '), wanneer: '', budget: '', mits: '', niet: '', partijen: [], waarde: 'klein' }, 'staan', '', meld); await tel(kv, 'beide'); }
    return { ok: true, sid };
  }
  return { ok: false, sid };
}
export async function gwTrek(kv, i, sl) {
  const r = /^[a-f0-9]{16}$/.test(String(i || '')) ? await kv.get('gw:k:' + i).catch(() => null) : null;
  if (!r || r.sHash !== hash(sl)) return false;
  r.status = 'ingetrokken'; await kv.set('gw:k:' + i, r, { ex: 30 * 86400 }); await kv.del(['gw:km:' + i]).catch(() => {}); return true;
}
export async function gwKaart(kv, i, sl) {
  const r = /^[a-f0-9]{16}$/.test(String(i || '')) ? await kv.get('gw:k:' + i).catch(() => null) : null;
  return r && r.sHash === hash(sl) ? r : null;
}

// ---------- stand ----------
export async function gwStand(kv) {
  const dagen = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)), trechter = {};
  for (const d of dagen) { try { const r = await kv.raw(['HGETALL', 'gw:stat:' + d]); for (let i = 0; i < r.length; i += 2) trechter[r[i]] = (trechter[r[i]] || 0) + (Number(r[i + 1]) || 0); } catch (e) {} }
  const open = {}; for (const t of TALEN) { try { const r = await kv.raw(['HGETALL', 'gw:open:' + t]); const o = {}; for (let i = 0; i < r.length; i += 2) o[r[i]] = Number(r[i + 1]) || 0; if (Object.keys(o).length) open[t] = o; } catch (e) {} }
  const ids = await kv.raw(['LRANGE', 'gw:lijst', 0, 29]).catch(() => []), recs = ids.length ? await kv.mget(...ids.map(i => 'gw:k:' + i)) : [];
  const kaarten = recs.filter(Boolean).map(r => ({ id: r.id, at: r.at, taal: r.taal, status: r.status, richting: r.kaart.richting, soort: r.kaart.soort, titel: r.kaart.titel, waarde: r.kaart.waarde, borg: r.borg, plaats: r.plaats, netwerk: (r.netwerk || []).length }));
  return { bijgewerkt: new Date().toISOString(), trechter7d: trechter, openingspills: open, kaarten };
}

// ---------- pagina's ----------
const CSS = `:root{--ink:#111113;--bg:#fff;--line:#E5E7EB;--ok:#1F7A4D}
@media (prefers-color-scheme:dark){:root{--ink:#F2F3F5;--bg:#0F1116;--line:#272C37;--ok:#71CF9E}}
*,*::before,*::after{box-sizing:border-box;min-width:0}html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:"Inter",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:17px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:var(--ink)}button,input{font:inherit;color:inherit}button:focus-visible,input:focus-visible,a:focus-visible{outline:2px solid var(--ink);outline-offset:2px}
.wrap{max-width:680px;margin:0 auto;padding:22px 20px 48px}.top{display:flex;align-items:center;gap:10px;margin-bottom:26px}.top a{font-weight:700;text-decoration:none;letter-spacing:-.01em}
h1{font-size:clamp(28px,6vw,40px);line-height:1.1;letter-spacing:-.03em;margin:0 0 10px;text-wrap:balance}p{margin:0 0 12px}
.ctx{display:inline-block;border:1px solid var(--ink);border-radius:12px;padding:3px 12px;margin:0 0 16px}
.site{width:100%;border:1.5px solid var(--ink);border-radius:999px;padding:11px 18px;background:transparent;margin:6px 0 4px}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 14px}.pill{border:1.5px solid var(--ink);background:transparent;border-radius:999px;padding:8px 15px;cursor:pointer;min-height:44px}
.pill[aria-pressed=true]{background:var(--ink);color:var(--bg);font-weight:600}.pill:disabled{cursor:default;opacity:1}
.ai{border:1.5px solid var(--ink);border-radius:16px 16px 16px 4px;padding:10px 14px;margin:0 0 10px;max-width:94%;white-space:pre-wrap}
.me{background:var(--ink);color:var(--bg);border-radius:16px 16px 4px 16px;padding:8px 14px;margin:0 0 12px auto;width:fit-content;max-width:85%;font-weight:600;white-space:pre-wrap}
.typ{display:flex;gap:8px;margin:12px 0 0}.typ input{flex:1;border:1.5px solid var(--ink);border-radius:999px;padding:11px 18px;background:transparent}
.cta{border:0;background:var(--ink);color:var(--bg);border-radius:999px;padding:11px 20px;font-weight:600;cursor:pointer;min-height:44px}.cta.ghost{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--ink)}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}
.kaart{border:1.5px solid var(--ink);border-radius:14px;overflow:hidden;margin:16px 0}.kaart .bar{background:var(--ink);color:var(--bg);padding:10px 16px;font-weight:700;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.kaart dl{margin:0;padding:4px 16px}.row{display:grid;grid-template-columns:minmax(0,9.5em) minmax(0,1fr);gap:12px;padding:9px 0;border-bottom:1px solid var(--line)}.row:last-child{border-bottom:0}.row dt{font-weight:600}.row dd{margin:0}
.kaart .rule{padding:10px 16px;border-top:1.5px solid var(--ink)}
.net{border:2px solid var(--ok);border-radius:14px;padding:10px 14px;margin:12px 0;font-weight:600}
.denk{display:inline-block;border:1.5px solid var(--ink);border-radius:16px;padding:8px 14px;margin:0 0 10px}
@media (max-width:420px){.row{grid-template-columns:minmax(0,1fr);gap:2px}}`;

function kop(taal, titel, desc, robots) {
  return `<!DOCTYPE html><html lang="${taal}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(titel)}</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="${robots}"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>${CSS}</style></head><body><div class="wrap"><div class="top"><a href="/${taal}">Sealed Intent</a></div>`;
}
const rijenHtml = (taal, k) => { const R = T[taal].rijen; return ['zoekt', 'biedt', 'waar', 'wanneer', 'budget', 'mits', 'niet'].filter(f => k[f]).map(f => `<div class="row"><dt>${esc(R[f])}</dt><dd>${esc(k[f])}</dd></div>`).join('') + ((k.partijen || []).length ? `<div class="row"><dt>${esc(R.partijen)}</dt><dd>${esc(k.partijen.join(', '))}</dd></div>` : ''); };

export function gwPagina(taal, { geo = {}, open = [], growthScript = '' } = {}) {
  const t = T[taal] || T.nl, plaats = [geo.stad, landNaam(geo.land, taal)].filter(Boolean).join(', ');
  const data = { taal, t: { typ: t.typ, stuur: t.stuur, klaarKnop: t.klaarKnop, kaart: t.kaart, anoniem: t.anoniem, rijen: t.rijen, regel: t.regel, mail: t.mail, mailPh: t.mailPh, mailUitleg: t.mailUitleg, staan: t.staan, uitzetH: t.uitzetH, ja: t.ja, nee: t.nee, klaarUitzet: t.klaarUitzet, klaarStaan: t.klaarStaan, statusLink: t.statusLink, bewaar: t.bewaar, fout: t.fout, denk: t.denk }, open };
  return kop(taal, t.titel + ' | Sealed Intent', t.meta, 'noindex, follow') + `
<main id="app">${plaats ? `<span class="ctx">${esc(plaats)} · ${esc(t.ongeveer)}</span>` : ''}
<h1>${esc(t.titel)}</h1><p>${esc(t.lead)}</p>
<input class="site" id="site" type="text" inputmode="url" autocomplete="url" autocapitalize="none" spellcheck="false" placeholder="${esc(t.site)}" aria-label="${esc(t.site)}">
<div id="log" aria-live="polite"></div>
<div class="pills" id="pills">${open.map(p => `<button type="button" class="pill" aria-pressed="false">${esc(p)}</button>`).join('')}</div>
<form class="typ" id="typ"><input id="tekst" type="text" autocomplete="off" placeholder="${esc(t.typ)}" aria-label="${esc(t.typ)}"><button class="cta" type="submit">${esc(t.stuur)}</button></form>
<div id="eind"></div></main></div>
<script>(function(){var D=${JSON.stringify(data).replace(/</g, '\\u003c')};var T=D.t,sid='',meer=false,bezig=false,kaart=null,borg=0,bedrijf='';
try{sid=sessionStorage.getItem('gw_sid')||''}catch(e){}
var $=function(i){return document.getElementById(i)},log=$('log'),pills=$('pills');
function el(tag,cls,txt){var x=document.createElement(tag);if(cls)x.className=cls;if(txt!=null)x.textContent=txt;return x}
function ctx(){var q=new URLSearchParams(location.search),r='';try{r=document.referrer?new URL(document.referrer).hostname:''}catch(e){}
return{tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||''),lang:navigator.language||'',ref:r,utm:[q.get('utm_source'),q.get('utm_campaign')].filter(Boolean).join('/')}}
function zet(o){return fetch('/?op=gw',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(o)}).then(function(r){return r.json()})}
function toonPills(lijst,m){pills.innerHTML='';meer=!!m;(lijst||[]).forEach(function(p){var b=el('button','pill',p);b.type='button';b.setAttribute('aria-pressed','false');pills.appendChild(b)});
if(meer&&lijst&&lijst.length){var k=el('button','cta',T.klaarKnop);k.type='button';k.id='meerklaar';pills.appendChild(k)}}
pills.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||bezig)return;if(b.id==='meerklaar'){var g=[].slice.call(pills.querySelectorAll('.pill[aria-pressed=true]')).map(function(x){return x.textContent});if(g.length)stap(g,'');return}
if(meer){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true');return}stap([b.textContent],'')});
$('typ').addEventListener('submit',function(e){e.preventDefault();var v=$('tekst').value.trim();if(!v||bezig)return;$('tekst').value='';stap([],v)});
function stap(keuze,tekst){bezig=true;var openGetoond=sid?[]:D.open;log.appendChild(el('div','me',keuze.concat(tekst?[tekst]:[]).join(', ')));pills.innerHTML='';var d=el('div','denk',T.denk+' …');log.appendChild(d);
zet({op:'gw',sid:sid,taal:D.taal,keuze:keuze,tekst:tekst,website:$('site').value.trim(),ctx:ctx(),open:openGetoond}).then(function(r){d.remove();bezig=false;if(!r||!r.ok){log.appendChild(el('div','ai',T.fout));return}
sid=r.sid;try{sessionStorage.setItem('gw_sid',sid)}catch(e){}$('site').style.display='none';var z=[r.zeg,r.let_op,r.vraag].filter(Boolean).join('\\n\\n');if(z)log.appendChild(el('div','ai',z));kaart=r.kaart;borg=r.borg||0;bedrijf=r.bedrijf||'';
if(r.klaar){$('typ').style.display='none';eind()}else toonPills(r.pills,r.meer);window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}).catch(function(){d.remove();bezig=false;log.appendChild(el('div','ai',T.fout))})}
function rij(dl,k,v){if(!v)return;var r=el('div','row');r.appendChild(el('dt',null,k));r.appendChild(el('dd',null,v));dl.appendChild(r)}
function eind(){var e=$('eind');e.innerHTML='';var c=el('div','kaart'),bar=el('div','bar');bar.appendChild(el('span',null,T.kaart));bar.appendChild(el('span',null,T.anoniem));c.appendChild(bar);var dl=el('dl');
['zoekt','biedt','waar','wanneer','budget','mits','niet'].forEach(function(f){rij(dl,T.rijen[f],kaart[f])});if(kaart.partijen&&kaart.partijen.length)rij(dl,T.rijen.partijen,kaart.partijen.join(', '));c.appendChild(dl);c.appendChild(el('div','rule',T.regel));e.appendChild(c);
if(bedrijf){var bq=el('div','ai',${JSON.stringify(t.beide('§'))}.replace('§',bedrijf));e.appendChild(bq);var bb=el('div','btns'),j=el('button','cta',T.ja),n=el('button','cta ghost',T.nee);j.type=n.type='button';bb.appendChild(j);bb.appendChild(n);e.appendChild(bb);
var bk=function(ja){zet({op:'gw',sid:sid,taal:D.taal,actie:'beide',ja:ja});bb.remove();bq.remove()};j.onclick=function(){bk(true)};n.onclick=function(){bk(false)}}
e.appendChild(el('p',null,T.mail));var m=el('input','site');m.type='email';m.id='mail';m.placeholder=T.mailPh;m.autocomplete='email';e.appendChild(m);e.appendChild(el('p',null,T.mailUitleg));
var k=el('div','btns'),u=el('button','cta',borg?${JSON.stringify(t.uitzet('§'))}.replace('§',borg):T.uitzetH),s=el('button','cta ghost',T.staan);u.type=s.type='button';k.appendChild(u);k.appendChild(s);e.appendChild(k);
if(borg)e.appendChild(el('p',null,${JSON.stringify(t.borgUitleg('§'))}.replace('§',borg)));
function kies(w){k.remove();zet({op:'gw',sid:sid,taal:D.taal,actie:'kies',keuze:w,mail:m.value.trim()}).then(function(r){if(!r||!r.ok){e.appendChild(el('div','ai',T.fout));return}
if(r.netwerk>0)e.appendChild(el('div','net',r.netwerk===1?${JSON.stringify(t.net(1))}:${JSON.stringify(t.net(2))}.replace(/^2/,r.netwerk)));e.appendChild(el('div','ai',w==='uitzetten'?T.klaarUitzet:T.klaarStaan));var a=el('a',null,T.statusLink);a.href=r.link;var p=el('p');p.appendChild(a);e.appendChild(p);e.appendChild(el('p',null,T.bewaar));
try{sessionStorage.removeItem('gw_sid')}catch(e){}})}
u.onclick=function(){kies('uitzetten')};s.onclick=function(){kies('staan')}}
})()</script>` + growthScript + '</body></html>';
}

export function gwStatusPagina(taal, rec) {
  const t = T[taal] || T.nl;
  if (!rec) return kop(taal, t.st.titel, t.meta, 'noindex, nofollow') + `<h1>${esc(t.st.titel)}</h1><p>${esc(t.st.nietGevonden)}</p></div></body></html>`;
  const stand = rec.status === 'uitgezet' ? t.st.uitgezet : rec.status === 'ingetrokken' ? t.st.ingetrokken : t.st.staan;
  return kop(taal, t.st.titel, t.meta, 'noindex, nofollow') + `<h1>${esc(rec.kaart.titel || t.st.titel)}</h1>
<div class="kaart"><div class="bar"><span>${esc(t.kaart)}</span><span>${esc(t.anoniem)}</span></div><dl>${rijenHtml(taal, rec.kaart)}<div class="row"><dt>${esc(t.st.status)}</dt><dd>${esc(stand)}</dd></div></dl><div class="rule">${esc(t.regel)}</div></div>
${(rec.netwerk || []).length && rec.status !== 'ingetrokken' ? `<div class="net">${esc(t.net(rec.netwerk.length))}</div>` : ''}
${rec.status !== 'ingetrokken' ? `<div class="btns"><button class="cta ghost" id="trek" type="button">${esc(t.st.trek)}</button></div>` : ''}<p id="uit"></p></div>
<script>(function(){var b=document.getElementById('trek');if(!b)return;b.onclick=function(){var q=new URLSearchParams(location.search);fetch('/?op=gwtrek',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({i:q.get('i'),s:q.get('s')})}).then(function(r){return r.json()}).then(function(r){if(r&&r.ok){b.remove();document.getElementById('uit').textContent=${JSON.stringify(t.st.getrokken)}}})}})()</script></body></html>`;
}

// ---------- de controle ----------
// Speelt drie gesprekken tegen de echte AI zonder iets te bewaren (eigen geheugen in plaats van Redis) en meldt per beurt wat er terugkwam.
export async function gwProef(ai) {
  const mem = new Map(), kvMem = { get: async k => mem.has(k) ? JSON.parse(mem.get(k)) : null, set: async (k, v) => { mem.set(k, JSON.stringify(v)); }, raw: async () => [], mget: async () => [], del: async () => 0 };
  const req = { headers: { 'x-vercel-ip-city': 'Gouda', 'x-vercel-ip-country': 'NL' } };
  const gesprekken = {
    fulfilment: [{ keuze: ['Leverancier zoeken'] }, { tekst: 'We zijn een webshop met ongeveer 1500 orders per maand en zoeken een nieuwe fulfilmentpartner.' }, { kies: 0 }, { kies: 0 }, { kies: 0 }, { kies: 0 }],
    klanten: [{ keuze: ['Klanten zoeken'] }, { tekst: 'We hebben magazijnruimte over voor drie webshops in Zuid-Holland.' }, { kies: 0 }, { kies: 0 }, { kies: 0 }, { kies: 0 }],
    complex: [{ keuze: ['Advocaat of financier'] }, { tekst: 'Mijn holding verkocht in 2016 een minderheidsbelang. Ik denk dat de prijs te laag was door informatie die achtergehouden is. Schade rond 5 miljoen. Er ligt al juridisch en waarderingsonderzoek. Ik zoek een advocaat en een procesfinancier met gedeeld risico en een vast plafond voor de eerste stap. Verjaring en finale kwijting zijn de eerste drempels.' }, { kies: 0 }, { kies: 0 }, { kies: 0 }, { kies: 0 }]
  };
  const uit = {};
  for (const [naam, beurten] of Object.entries(gesprekken)) {
    let sid = '', vorige = null; const regels = [];
    for (const b of beurten) {
      if (vorige && vorige.klaar) break;
      const keuze = b.kies != null ? (vorige && vorige.pills && vorige.pills.length ? [vorige.pills[b.kies]] : []) : (b.keuze || []);
      if (b.kies != null && !keuze.length) break;
      const r = await gwStap(kvMem, { sid, taal: 'nl', keuze, tekst: b.tekst || '' }, req, { ai });
      sid = r.sid; vorige = r;
      regels.push({ zei: [keuze.join(', '), b.tekst || ''].filter(Boolean).join(' | ').slice(0, 80), ai: r.ai, zeg: r.zeg, vraag: r.vraag, pills: r.pills, klaar: r.klaar });
    }
    const goed = regels.every(x => x.ai && (x.klaar || (x.vraag && x.pills && x.pills.length >= 2)));
    uit[naam] = { goed, klaar: !!(vorige && vorige.klaar), kaart: vorige && vorige.kaart, borg: vorige && vorige.borg, beurten: regels };
  }
  return { goed: Object.values(uit).every(x => x.goed), gesprekken: uit };
}
