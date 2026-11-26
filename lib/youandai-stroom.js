// Mailmind-stroom youandai (Henkjan 26 nov 2026: "Ze kunnen gewoon mailen met Youandai als iets niet duidelijk gaat naar mij dit zit in mailmind").
// Elke nieuwe bevestigde abonnee van You and AI (youandai.now, todayin bzz/lib/todayin-ai.js markConfirmed -> POST /api/mm/ai-welkom) krijgt één
// persoonlijke welkomstmail uit Henkjans Gmail met één vraag: wat wil jij weten over AI? Wie antwoordt krijgt van de antwoordmotor een AI-antwoord
// als het 100% uit de kennis hieronder volgt; anders de vraag om nog een keer te antwoorden, en die tweede reply gaat naar Henkjan (lib/mailmind.js).
// Ja = een antwoord op de mail. Twee varianten, Thompson. Talen nl, en, de per abonnee. LIVE pas op Henkjans "verstuur".
import { createHash, timingSafeEqual } from 'node:crypto';
import { kv } from './db.js';
import * as M from './mailmind.js';

export const LIVE = false; // wacht op Henkjans "verstuur"
const S = 'youandai', SITE = 'https://youandai.now';
const T = a => (['nl', 'en', 'de'].includes(a && a.taal) ? a.taal : 'en');

export const VARIANTEN = [
  { o: 'Welkom bij You and AI. Eén vraag', t: 'Hoi,\n\nJe krijgt vanaf nu elke ochtend You and AI: wat AI verandert voor je werk, je denken en je keuzes. Kort, met de bron erbij.\n\nEén vraag: wat wil jij weten over AI? Antwoord op deze mail. Je krijgt antwoord, en goede vragen worden een stuk op de site.\n\nIs er iets niet duidelijk of klopt er iets niet? Ook dan: gewoon antwoorden. Bellen of appen kan op +31 6 55395630.\n\nHenkjan de Krijger\nUitgever van You and AI, {site}\n\nGeen mail meer: {stop}',
    en: { o: 'Welcome to You and AI. One question', t: 'Hi,\n\nFrom now on you get You and AI every morning: what AI changes for your work, your thinking and your choices. Short, with the source.\n\nOne question: what do you want to know about AI? Reply to this email. You will get an answer, and good questions become a piece on the site.\n\nSomething unclear or wrong? Same thing: just reply. You can also call or message +31 6 55395630.\n\nHenkjan de Krijger\nPublisher of You and AI, {site}\n\nNo more email: {stop}' },
    de: { o: 'Willkommen bei You and AI. Eine Frage', t: 'Hallo,\n\nab jetzt bekommst du jeden Morgen You and AI: was KI für deine Arbeit, dein Denken und deine Entscheidungen verändert. Kurz, mit Quelle.\n\nEine Frage: Was möchtest du über KI wissen? Antworte auf diese E-Mail. Du bekommst eine Antwort, und gute Fragen werden ein Beitrag auf der Seite.\n\nIst etwas unklar oder stimmt etwas nicht? Auch dann: einfach antworten. Anrufen oder schreiben geht unter +31 6 55395630.\n\nHenkjan de Krijger\nHerausgeber von You and AI, {site}\n\nKeine E-Mails mehr: {stop}' } },
  { o: 'Waar loop jij tegenaan met AI?', t: 'Hoi,\n\nDank dat je You and AI leest. Ik bouw al dertig jaar op internet en wil weten waar jij met AI tegenaan loopt: op je werk, thuis of bij iets wat je niet vertrouwt.\n\nAntwoord op deze mail met twee zinnen. Je krijgt antwoord, en wat veel mensen bezighoudt zoeken we uit en schrijven we op.\n\nBellen of appen kan ook: +31 6 55395630.\n\nHenkjan de Krijger\nUitgever van You and AI, {site}\n\nGeen mail meer: {stop}',
    en: { o: 'What is your problem with AI?', t: 'Hi,\n\nThanks for reading You and AI. I have been building on the internet for thirty years and want to know where AI gets in your way: at work, at home, or something you do not trust.\n\nReply to this email with two sentences. You will get an answer, and what many readers struggle with we research and write up.\n\nYou can also call or message +31 6 55395630.\n\nHenkjan de Krijger\nPublisher of You and AI, {site}\n\nNo more email: {stop}' },
    de: { o: 'Wo hakt es bei dir mit KI?', t: 'Hallo,\n\ndanke, dass du You and AI liest. Ich baue seit dreißig Jahren im Internet und möchte wissen, wo KI dir im Weg steht: bei der Arbeit, zu Hause oder bei etwas, dem du nicht traust.\n\nAntworte auf diese E-Mail mit zwei Sätzen. Du bekommst eine Antwort, und was viele beschäftigt, recherchieren wir und schreiben es auf.\n\nAnrufen oder schreiben geht auch: +31 6 55395630.\n\nHenkjan de Krijger\nHerausgeber von You and AI, {site}\n\nKeine E-Mails mehr: {stop}' } }
];

export function mailTekst(a, { v }) {
  const taal = T(a), x = taal === 'nl' ? v : (v[taal] || v.en || v), stop = /^https:\/\/youandai\.now\//.test(String(a.afm || '')) ? a.afm : SITE + '/' + taal + '/afmelden';
  const vul = s => String(s).split('{site}').join(SITE + '/' + taal).split('{stop}').join(stop);
  return { onderwerp: vul(x.o), tekst: vul(x.t), stop };
}

export function kennis(a) {
  const taal = T(a);
  return ['YOU AND AI (' + SITE + '/' + taal + '): gratis dagelijkse ochtendmail en site over wat AI verandert voor je werk, je denken en leren, wat je kunt vertrouwen en wie beslist (jij of een AI-agent). Talen: Nederlands, Engels, Duits.',
    'Elk stuk begint met een TL;DR van één of twee zinnen, noemt de oorspronkelijke bron en zegt eerlijk wat nog niet bewezen is. De stukken schrijft een AI-redactie; Henkjan de Krijger is de uitgever (30 jaar internet, bouwer van Nexy en Mijndomein), niet de auteur.',
    'Kosten: niets. Eén mail per dag, in de ochtend. Afmelden: de link onderaan elke mail, of antwoord met "stop". Voorkeuren (thema\'s): de link Voorkeuren onderaan de ochtendmail.',
    'Een vraag of idee insturen: antwoord op een mail van You and AI. De redactie leest ideeën en kiest er onderwerpen uit; er is geen garantie dat een idee een stuk wordt en geen termijn.',
    'Eerdere stukken en zoeken: ' + SITE + '/' + taal + '. Privacy: ' + SITE + '/' + taal + '/privacy. You and AI verkoopt geen adressen.',
    'You and AI geeft geen persoonlijk advies over medische, juridische of financiële beslissingen en beveelt geen betaalde producten aan. Vragen daarover, klachten, samenwerking, pers of iets wat hier niet staat: Henkjan antwoordt zelf.',
    'Antwoord in de taal van de reply (' + taal + ').'].join('\n');
}

export const STROOM = {
  id: S, LIVE, kanaal: 'gmail', fromName: 'Henkjan de Krijger', wie: 'youandai', taal: 'nl', soort: 'klant',
  doel: 'Nieuwe abonnee van You and AI antwoordt met wat hij over AI wil weten', std: { perDag: 40, max: 150, perUur: 10 }, uren: [8, 22],
  varianten: VARIANTEN, mail: (a, o) => mailTekst(a, o),
  bak: a => T(a) + '|' + String(a.bron || 'x').replace(/[^a-z0-9-]/gi, '').slice(0, 14) + '|' + M.soortAdres(a.m),
  voorkennis: () => [1, 9], // verwachting 10% antwoordt
  antwoord: true, kennis: a => kennis(a),
  async bijJa() { return {}; }
};

// POST /api/mm/ai-welkom (Bearer CLICKMIND_AI_SECRET, zelfde sleutel als ai-confirm): een bevestigde abonnee in de bak, eenmalig per adres.
const dg = v => createHash('sha256').update(String(v)).digest();
export async function welkom({ method, authorization, body, secret } = {}) {
  if (method !== 'POST') return { status: 405, body: { ok: false, fout: 'POST' } };
  const b = /^Bearer\s+(.+)$/i.exec(String(authorization || ''));
  if (!secret || !b || !timingSafeEqual(dg(b[1]), dg(secret))) return { status: 401, body: { ok: false, fout: 'sleutel' } };
  const m = String(body && body.email || '').trim().toLowerCase(); if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i.test(m)) return { status: 400, body: { ok: false, fout: 'adres' } };
  const h = createHash('sha256').update('youandai|' + m).digest('hex').slice(0, 32);
  if ((await kv.raw(['SET', 'mlm:youandai:welkom:' + h, '1', 'NX', 'EX', String(800 * 86400)]).catch(() => null)) !== 'OK') return { status: 200, body: { ok: true, al: true } };
  if (await M.geblokkeerd(m)) return { status: 200, body: { ok: true, geblokkeerd: true } };
  const r = await M.vul(S, [{ m, taal: ['nl', 'en', 'de'].includes(body.lang) ? body.lang : 'en', bron: String(body.bron || 'x').slice(0, 20), afm: String(body.afmelden || '').slice(0, 400) }]);
  return { status: 200, body: { ok: true, erbij: r.erbij } };
}
