// Levende overdracht van todayin surgery (Henkjan 15 nov 2026: "Schrijf een handover op vercel zodat ik dit kan oppakken in andere chat").
// Live: https://todayin.email/surgery/overdracht (tekst) en ?vorm=json. Wordt bij elk bezoek opgebouwd uit de code, de data en de live
// cijfers; alleen WERKING, OPEN en VASTE_TAKEN hieronder schrijf je met de hand bij (in dezelfde commit als de wijziging).
import { SITE, PAGES, CHECK } from './tsc-data.js';
import { LIJSTEN, gerangschikt, RANK_SLUGS, METHODE } from './tsc-rank.js';
import NIEUWS from '../data/tsc-nieuws.json' with { type: 'json' };

export const BIJGEWERKT = '2026-11-15';

const WERKING = [
  'Wat: onafhankelijke keuzehulp voor chirurgie thuis en in het buitenland (kosten, vergoeding, chirurg checken, rankings van klinieken) in EN, NL en DE, met een chat bovenaan elke pagina en een ochtendmail per route. Doel van Henkjan: elke dag meer organisch verkeer uit Google, Bing en AI-assistenten, en lezers van de ochtendmail.',
  'Waar: todayin.email/surgery. De naam marineert nog (Henkjan 14 nov: "Nee niet kopen . Wil naam laten marineren"); kandidaat was truesurgerycost.com (kosten wordt 2x zo vaak gezocht als route). Geen domein kopen zonder zijn woord.',
  'Routing: repo todayin, site/vercel.json stuurt /surgery en /surgery/* door naar https://keuzehulp.best/true-surgery?p=<pad>; in hjdk-api vercel.json /true-surgery naar /api/keuze-tools?tool=tsc (geen /api/-pad, dus geen noindex). Testen zonder todayin: https://hjdk-api-henq.vercel.app/true-surgery?p=<pad> (beschermde host, noindex).',
  'Code (repo hjdk-api): lib/tsc.js (pagina\'s, chat-blok, aanmelding, rekenhulp, sitemap, llms.txt, IndexNow, stand, routes), lib/tsc-data.js (PAGES, CHECK, SRC, HOME: alleen feiten met bron), lib/tsc-chat.js (chat), lib/tsc-mail.js (ochtendmail), lib/tsc-rank.js en data/tsc-rank.json (rankings), data/tsc-rank-ruw/ (ruwe onderzoeksdata en merge-script per ranking), data/tsc-nieuws.json (nieuws voor de mail), data/tsc-routes.json (routekaart herkomst naar bestemming), lib/tsc-overdracht.js (deze overdracht). Werking ook in lib/werking.js regel todayin surgery.',
  'Chat: tik op een voorbeeldvraag = FAQ-antwoord zonder AI, de volgorde volgt de tikken (tsc:tik:<slug>). Eigen vraag = Claude Haiku met alleen onze pagina\'s en rankings: rechtstreeks met ANTHROPIC_API_KEY als die aan hjdk-api gekoppeld is, anders via de AI Gateway (Henkjan 14 nov akkoord), bij een fout een woordzoeker. Vragen in tsc:vragen, onbeantwoorde in tsc:open; de dagronde zet antwoorden met bron als FAQ op de pagina. Geen persoonlijk medisch advies, geen gezondheidsgegevens vragen.',
  'Ochtendmail: aanmelden met e-mail en route (ingreep, bestemming, thuisland), dubbele opt-in, welkomstmail met de laatste veranderingen, daarna cron 08:10 UTC alleen bij nieuws voor die route uit data/tsc-nieuws.json. Afzender surgery@todayin.email (Resend). Meting: geopend (pixel /o), geklikt (/k), afmelden met één klik (/af).',
  'Rankings: elke kliniek krijgt punten voor kwalificaties (ISHRS, IAHRS, ABHRS, specialisme, tot ' + METHODE.kwal + '), vergunning en accreditatie (tot ' + METHODE.verg + '), patiëntervaringen op onafhankelijke platforms plus onafhankelijke forumvermeldingen (tot ' + METHODE.erv + '), openheid over prijs en wie opereert (tot ' + METHODE.open + ') en aftrek voor gemelde risico\'s (tot ' + METHODE.risico + '). Plek alleen met data in twee groepen en ' + METHODE.minReviews + '+ reviews, of bewezen kwalificatie plus twee onafhankelijke vermeldingen. Conclusie per kliniek in drie talen. Klinieken sturen correcties via het formulier (tsc:correcties).',
  'Meten: menselijk bezoek per bron (google, zoek, ai, mail, intern, ander, direct) met een beacon na 3 seconden of een tik, crawlers server-side (bot_*), organisch per pagina. Search Console: sc-domain:todayin.email (sitemap /surgery/sitemap.xml ingediend 15 nov), Bing via IndexNow (sleutel in /surgery/). ZICHT-proef ti-2026-11-15-surgery-v1 in todayin site/public/zicht.json.',
  'Regels: elk getal met bron; geen gedachtestreepjes; titel hooguit 60 tekens, description hooguit 155; geen tekst die naar AI ruikt; geen aggregateRating; betaalde top-10-lijsten zijn geen bron; negatieve feiten alleen uit betrouwbare bronnen en neutraal; geen kliniek betaalt; DataForSEO niet los aanroepen (Demand Radar thema plastische-chirurgie uit cache); commit met expliciete bestandsnamen, git pull --rebase, push naar main.'
];

const VASTE_TAKEN = [
  'Vercel-cron 08:10 UTC: /api/keuze-tools?tool=tsc&p=ronde (ochtendmail, alleen bij nieuws).',
  'Geplande Claude-taak "todayin surgery dagronde", elke dag 11:37 UTC: stand lezen, open chatvragen beantwoorden met bron, nieuws per route in data/tsc-nieuws.json, één nieuwe gids in EN, NL en DE, IndexNow, werklog, melding aan Henkjan.',
  'Geplande Claude-taak "todayin surgery rankings", elke dag 13:13 UTC (Henkjan 14 nov: "JA"): één nieuwe ranking per dag (Mexico buikwandcorrectie, Colombia, Dominicaanse Republiek, Zuid-Korea, Thailand, tandimplantaten Turkije) met vier onderzoekers parallel, daarna de oudste lijst verversen; melding aan Henkjan.',
  'Dagrapport organisch verkeer in de kz-chat om 14:07 UTC (keuzehulpen); todayin surgery staat er niet in tenzij erbij gezet.'
];

const OPEN = [
  'Eerste organische cijfers zondag 22 november 2026 (Henkjans doel: eind van de week resultaten zien).',
  'Naam en eigen domein: Henkjan laat de naam marineren. Bij een domein: 301 per pagina, canonical, hreflang, sitemap en IndexNow mee verhuizen.',
  'ANTHROPIC_API_KEY (gedeelde teamvariabele) is niet aan hjdk-api gekoppeld; de chat gebruikt nu de AI Gateway. Koppelen kan alleen Henkjan in Vercel.',
  'Turks vergunningsregister (ministerie) en JCI-zoekfunctie niet automatisch te lezen: vergunning scoort voor elke kliniek nul. De rankingronde probeert het opnieuw.',
  'Aanmelding voor de ochtendmail is niet met een echt adres getest (bevestigings- en welkomstmail).',
  'Demand Radar: de schone meting van 16 november (alleen ingrepen, ook de VS) gebruiken voor nieuwe gidsen en de naamkeuze.',
  'Aanvullende verzekeringen 2027 (NL) worden uiterlijk 19 november bekend: ooglid- en liposuctiepagina bijwerken.'
];

const N = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
export async function overdracht(kv, base) {
  const M = await import('./tsc-mail.js'); const C = await import('./tsc-chat.js');
  const st = await M.stand().catch(() => ({})); const vr = await C.tscVragen(300).catch(() => ({ vragen: [], open: [], correcties: [] }));
  let log = []; try { log = ((await kv.raw(['LRANGE', 'mm:handover:log', '0', '299'])) || []).map(x => { try { return JSON.parse(x); } catch (e) { return null; } }).filter(x => x && (/surgery/i.test(x.wie || '') || /todayin surgery|tsc[:\- ]|rankings? van klinieken/i.test(x.tekst || ''))).slice(0, 25); } catch (e) {}
  const per = {}; for (const [s, p] of Object.entries(PAGES)) (per[p.taal] = per[p.taal] || []).push(s);
  const rankings = Object.entries(LIJSTEN).map(([id, l]) => { const { rang, weinig } = gerangschikt(id); return { id, gecontroleerd: l.gecontroleerd, links: Object.values(l.slugs || {}).map(s => base + '/' + s), gerangschikt: rang.length, te_weinig_data: weinig.length, top3: rang.slice(0, 3).map(k => k.naam + ' (' + k.s.totaal + ')') }; });
  const d7 = (st.dagen || []).slice(0, 7), som = f => d7.reduce((a, x) => a + N(x[f]), 0);
  const stand = {
    paginas: { totaal: Object.keys(PAGES).length + Object.keys(CHECK).length + Object.keys(RANK_SLUGS).length + 3, gidsen_per_taal: Object.fromEntries(Object.entries(per).map(([t, l]) => [t, l.length])), checkpaginas: Object.keys(CHECK).length, rankingpaginas: Object.keys(RANK_SLUGS).length, bijgewerkt: SITE.updated },
    bezoek_7_dagen: { mensen: som('bezoek'), google: som('bezoek_google'), bing_en_andere: som('bezoek_zoek'), ai: som('bezoek_ai'), mail: som('bezoek_mail') },
    crawlers_7_dagen: Object.fromEntries(['googlebot', 'bingbot', 'oai-search', 'chatgpt-user', 'gptbot', 'perplexity', 'claude', 'applebot'].map(b => [b, som('bot_' + b)])),
    chat_7_dagen: { tikken: som('tik'), vragen: som('vraag'), zonder_antwoord: som('open'), open_nu: (vr.open || []).length, correcties_klinieken: (vr.correcties || []).length },
    mail: { abonnees: st.abonnees || 0, aanvragen_7d: som('aanvraag'), bevestigd_7d: som('bevestigd'), verstuurd_7d: som('verstuurd'), geopend_7d: som('geopend'), klikkers_7d: som('klikker'), laatste_ronde: st.laatsteRonde || null, nieuwsitems: (NIEUWS.items || []).length, nieuwste: st.nieuwsste || null },
    rankings
  };
  const links = { site: base, stand: base + '/stand', overdracht: base + '/overdracht', sitemap: base + '/sitemap.xml', llms: base + '/llms.txt', vragen_en_correcties: 'https://hjdk-api-henq.vercel.app/true-surgery?p=vragen', chat_test: 'https://hjdk-api-henq.vercel.app/true-surgery?p=chattest&taal=nl&s=<slug>&v=<vraag>', mail_droog: 'https://hjdk-api-henq.vercel.app/true-surgery?p=ronde&droog=1', indexnow: 'https://hjdk-api-henq.vercel.app/true-surgery?p=indexnow', search_console: 'https://hjdk-api-henq.vercel.app/api/gsc?op=surgery', zoekvragen: 'https://hjdk-api-henq.vercel.app/api/zicht?op=zoekvragen&site=todayin&dagen=28', demand_radar: 'https://demandradar-ivory.vercel.app/api/zoekvraag?thema=plastische-chirurgie&cc=NL', werklog_bijschrijven: 'https://hjdk-api-henq.vercel.app/api/mm/handover?log=<tekst>&wie=surgery-<chat>' };
  return { titel: 'Overdracht todayin surgery', opgebouwd: new Date().toISOString(), werking_bijgewerkt: BIJGEWERKT, eerst_lezen: 'Lees dit, dan CLAUDE.md van hjdk-api en de skill .claude/skills/zicht-seo-llm. Werk na elke stap het werklog bij (link werklog_bijschrijven, wie=surgery-...) en bij een wijziging in hoe iets werkt WERKING/OPEN in lib/tsc-overdracht.js en lib/werking.js.', werking: WERKING, vaste_taken: VASTE_TAKEN, stand, open: OPEN, werklog: log, links, paginas: Object.fromEntries(Object.entries(per).map(([t, l]) => [t, l.map(s => base + '/' + s)])) };
}
export function alsTekst(o) {
  const r = ['# ' + o.titel, '', 'Opgebouwd: ' + o.opgebouwd + ' (live, bij elk bezoek). Werking bijgewerkt: ' + o.werking_bijgewerkt + '.', '', o.eerst_lezen, '', '## Werking'];
  for (const w of o.werking) r.push('- ' + w);
  r.push('', '## Vaste taken'); for (const w of o.vaste_taken) r.push('- ' + w);
  const s = o.stand; r.push('', '## Stand nu',
    '- Pagina\'s: ' + s.paginas.totaal + ' (gidsen per taal: ' + Object.entries(s.paginas.gidsen_per_taal).map(([t, n]) => t + ' ' + n).join(', ') + '; ' + s.paginas.checkpaginas + ' chirurg-checkpagina\'s; ' + s.paginas.rankingpaginas + ' rankingpagina\'s). Inhoud bijgewerkt ' + s.paginas.bijgewerkt + '.',
    '- Bezoek 7 dagen (mensen): ' + s.bezoek_7_dagen.mensen + ' totaal, Google ' + s.bezoek_7_dagen.google + ', Bing en andere ' + s.bezoek_7_dagen.bing_en_andere + ', AI ' + s.bezoek_7_dagen.ai + ', mail ' + s.bezoek_7_dagen.mail + '.',
    '- Crawlers 7 dagen: ' + Object.entries(s.crawlers_7_dagen).map(([b, n]) => b + ' ' + n).join(', ') + '.',
    '- Chat 7 dagen: ' + s.chat_7_dagen.tikken + ' tikken, ' + s.chat_7_dagen.vragen + ' eigen vragen, ' + s.chat_7_dagen.zonder_antwoord + ' zonder antwoord; nu open: ' + s.chat_7_dagen.open_nu + '; correcties van klinieken: ' + s.chat_7_dagen.correcties_klinieken + '.',
    '- Mail: ' + s.mail.abonnees + ' abonnees; 7 dagen ' + s.mail.aanvragen_7d + ' aanvragen, ' + s.mail.bevestigd_7d + ' bevestigd, ' + s.mail.verstuurd_7d + ' verstuurd, ' + s.mail.geopend_7d + ' geopend, ' + s.mail.klikkers_7d + ' klikkers. Nieuwsitems: ' + s.mail.nieuwsitems + ' (nieuwste ' + s.mail.nieuwste + ').');
  for (const k of s.rankings) r.push('- Ranking ' + k.id + ' (data ' + k.gecontroleerd + '): ' + k.gerangschikt + ' gerangschikt, ' + k.te_weinig_data + ' te weinig data; top 3: ' + k.top3.join(', ') + '. ' + k.links.join(' '));
  r.push('', '## Open punten'); for (const w of o.open) r.push('- ' + w);
  r.push('', '## Werklog (nieuwste boven)'); for (const l of o.werklog) r.push('- ' + String(l.t).slice(0, 16).replace('T', ' ') + ' ' + (l.wie || '') + ': ' + l.tekst);
  r.push('', '## Links'); for (const [k, v] of Object.entries(o.links)) r.push('- ' + k + ': ' + v);
  r.push('', '## Pagina\'s'); for (const [t, l] of Object.entries(o.paginas)) r.push('- ' + t + ': ' + l.join(' '));
  return r.join('\n') + '\n';
}
