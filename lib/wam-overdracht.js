// Overdracht van We Are Many (WAM) voor een volgende chat (Henkjan 15 nov 2026 12:26 UTC: "Scchrijf uitgebreide handover op vercel zodat ik kan
// overnemen in andere chat ."). Live op https://hjdk-api-henq.vercel.app/api/wam?op=overdracht (beschermde host; ?format=json of ?format=md).
// Vast deel (VAST) werk je bij in dezelfde commit als elke wijziging aan hoe WAM werkt, net als lib/werking.js (WAM_WERKING).
// Het live deel komt bij elk bezoek uit Redis. Geen sleutels, geen telefoonnummers, geen gesprekken in deze pagina.
import * as W from './wam.js';
import { WAM_WERKING, WERKING_DATUM } from './werking.js';

const N = (x) => Number(x) || 0;
export const OVERDRACHT_DATUM = '2026-11-15';

const VAST = {
  wat: [
    'We Are Many (wearemany.now) is een AI-matchmaker in een chat. Iemand zegt wat hij zoekt of aanbiedt (kamer, werk, klus, spullen, een maatje), WAM legt het vast als aanbod of zoektocht in de commons en koppelt vraag aan aanbod in dezelfde stad of hetzelfde land. Wereldwijd, vooral Canada (Toronto), VS, VK, NL, DE en India.',
    'Noordster (Henkjan): echte verbinding tussen mensen, niet kliks of gesprekken. Een match telt pas als twee mensen elkaar echt spreken. Daarnaast: leren hoe mensen echt verbonden raken, en snel groeien via warme kringen (de kortste weg).',
    'Mandaat (Henkjan 10 nov): "je moet gewoon beste voor WAM doen altijd". Binnen de harde grenzen hieronder doet de chat zelf wat het beste is en meldt het achteraf.',
  ],
  stand_vast: [
    'Campagnes: ALLES UIT sinds 15 nov 02:31 UTC (Henkjan: "Stop maar even met campagne."). De laatste lijn WAM CA FRAMES (PropellerAds 12136847) is gestopt. In propellerads-mcp lib/budget.ts staan WAM_UIT = true en WAM_VONK = [], dus de connector weigert elke WAM-start en de dagkopie (lib/wamkopie.ts) maakt niets. Weer aan alleen op Henkjans woord: dan WAM_VONK of WAM_UIT aanpassen en de campagne starten.',
    'Laatste cijfers van de vonk (13 en 14 nov, Canada en VS, In-Page, CPA met "dialoog" als conversie): ongeveer $0,05 per echt gesprek (dialoog), maar nog geen echte verbinding tussen twee mensen. Op 14 nov: 58 voorstellen, 4 bereikten de ander, 0 keer allebei ja. Daarom eerst vertrouwen, dan matchen.',
    'WhatsApp: weer aan op het WAM-nummer (eindigt op 117, het curacao.day-nummer), alleen reageren. Henkjans eigen nummer doet nooit mee.',
    'Gedeeld nummer (18 nov 2026, Henkjan: "Ja bouw met dat nr"): curacao.day gebruikt het nummer dat eindigt op 117 ook weer. whatsappp-mcp 1.67 (src/cur.js verdeel) stuurt een gesprek naar de curacao.day-assistent als het bericht curacao.day noemt of met Prikbord begint, of als het al een curacao.day-gesprek was; al het andere, en elk lopend WAM-gesprek, blijft bij WAM.',
    'Er zijn op 15 nov geen geplande WAM-rondes meer. De leerronde in de cloud (cron /api/wam?op=leer om :09 en :39) draait wel door: coach, matchronde, beloftes, rapport.',
  ],
  besluiten: [
    '16 nov 14:34 UTC: "ja zeker" op het voorstel de intentiechat voor alle keuzehulpen (keuzehulp.best, whichtobuy.best, kaufberater.best, straks dienstpagina\'s) op de WAM-motor te bouwen in plaats van een tweede chat: zelfde leermeter, proeven, coach en AI-plafond, plus de context van de pagina. "Leer van elkaar": lessen uit WAM (terugbereiken is het lek, push werkt, delen alleen met een concrete reden, vertrouwen eerst, WhatsApp alleen reageren) gelden daar ook, en wat de keuzehulpen leren komt terug in WAM. Nieuw WhatsApp-nummer daarvoor: nog even niet ("vergeet nr nog even"). Plan: keuzehulp-overdracht, Open punten.',
    '15 nov 02:31 UTC: "Stop maar even met campagne." Vonk WAM CA FRAMES gestopt, WAM_VONK leeg.',
    '14 nov 23:44 UTC: "Probeer dit . We versturen bijna niets . We ontvangen en delen de contacten we maken de connectie ." Contact delen in plaats van doorsturen: liet iemand zijn WhatsApp achter voor matches, dan krijgt wie verbindt meteen dat nummer en appen ze zelf. Hoogstens 3 keer per nummer per dag.',
    '14 nov 23:27 UTC: "QR code is gescand we doen alleen inderdaad reageren . op een zorgvuldig verstuurd bericht naar ons ." WAM appt nooit uit zichzelf; alleen antwoord op het ingevulde bericht van de WhatsApp-knop van iemand die serieus was.',
    '14 nov 22:44 UTC: "Whatsapp is terug . ! Zorg dat we er niet vanaf gegooid worden ... heel veel bs berichten van india dus moet serieus zijn dan pas whapp ." WhatsApp alleen voor wie serieus is, strengere lat voor India, Pakistan, Bangladesh en Nigeria, lage daggrenzen.',
    '14 nov 22:50 UTC: "Kun je wel of niet SMS aan met vercel ?" Vercel heeft zelf geen sms. De code is klaar voor Twilio, Bird of Textbelt; er staat nog geen sleutel. Antwoord gegeven, wacht op Henkjan.',
    '14 nov 20:26 UTC: "ja" op de kortste weg (warme kringen, minste stappen wint, topverbinder) plus één kleine vonk-campagne.',
    '14 nov 18:41 UTC: WhatsApp-nummer was door Meta geblokkeerd; meldingen via push op de telefoon en mail ("En of mail natuurlijk").',
    '14 nov 13:21 Curaçao: "We moeten eerst vertrouwen regelen dan matchen" en "Zet campagnes stop tot we beter ontwerp hebben ." Onderzoek "Vertrouwen eerst dan matchen" gedaan, alle 10 mechanismen gebouwd.',
    '14 nov 12:51 UTC: "haal mijn nr er helemaal uit . Dit is nu echt WAM nr". Henkjans eigen nummer nooit meer voor WAM.',
    '10 nov 20:34 UTC: mandaat "gewoon beste voor WAM doen altijd". 9 nov: start, relatie is de noordster, rapport hier in de chat en niet via Telegram.',
  ],
  hoe: [
    'Bezoeker: advertentie of link naar wearemany.now (via Clickmind-wissel whichtobuy.best/w/wam bij betaald verkeer). De server kiest een opener (Thompson per taal en familie) en zet hem in de HTML. Elke beurt: zeg() in lib/wam.js; AI via de AI Gateway (Haiku), plafond $10 per UTC-dag (op=kost).',
    'Vastleggen: aanbod (kant biedt) en zoektochten in Redis wam:zw (sleutel <vid>:<id>), zonder naam. Matchen gebeurt meteen bij een concreet wat en een plaats (directMatch), plus de matchronde elk half uur.',
    'Vertrouwen eerst (14 nov, 10 mechanismen): huisregel en oprichter in elk voorstel, echte-mens-regel en "geen klachten", gedeelde dingen tussen beiden, belofte bij aanbieders (A/B/C, wam:belarm), "ik meen het"-ster (2 per week), kennismakingsladder (pas onthuld als beiden antwoordden), oplichterswoorden geven een waarschuwing en na 3 keer een stop, "niet voor mij" met reden, hoogstens 8 verbindverzoeken per uur, check-in na 24 uur waarbij de ander pas hoort dat het lukte als beiden bevestigden.',
    'Kortste weg (14 nov): een vraag kan via je eigen kring rondgaan (hulp-links, wam:pad, wam:kring, wam:knoop). Elke doorgifte brengt dichter bij; wie verbindt krijgt credits en een plek in de topverbinders per week (wam:topverb). Eigen kring vooraan bij het matchen (+3). Stand: op=pad.',
    'Contact maken: Connect me maakt een paar (wam:mp). Heeft de ander zijn WhatsApp achtergelaten voor matches (wam:zwnr), dan krijgt de verbinder meteen dat nummer (DIRECT). Anders vraagt WAM de ander om een ja via zijn inbox (wam:inbox, ook push en mail) en wisselen ze pas nummers als beide dat willen.',
    'Meldingen: push op de telefoon (lib/wam-push.js, VAPID uit Redis, service worker /sw.js), mail via Resend vanaf wearemany.now (lib/wam-post.js, antwoorden komen binnen via op=mailin), Telegram-bot @WeAreManyNowBot. Sms (lib/wam-sms.js) staat klaar maar heeft geen sleutel. WhatsApp is geen meldkanaal meer.',
    'WhatsApp: repo whatsappp-mcp (Railway, src/wam.js) koppelt het WAM-nummer en stuurt elk bericht als hash naar op=wain, nooit het nummer. hjdk-api waIn beslist: alleen het ingevulde bericht van de knop (code onzichtbaar erin, of herkend op tekst en tijd) van iemand die in de chat waSerieus doorstond, krijgt antwoord. Wat WAM later wil zeggen (wam:waq) gaat alleen mee binnen 10 minuten na hun laatste bericht. Na een ja op de deelvraag geeft de koppeling alleen voor dat gesprek het nummer door (op=wanr).',
    'Leren: leermeter met proeven (op=exp, één JSON-object per proef met voorspelling), Thompson in openers, knoppen, kop, schermonderdelen, contactknoppen, later melden, belofte-armen en de nog-niemand-teksten. De coach (Sonnet) doet hoogstens 2 wijzigingen per half uur. Halfuurrapport in wam:rapporten (op=rapport).',
    'Clickmind: de wissel wam meldt dialoog (3e beurt, of 2e met eigen tekst) als conversie aan PropellerAds en Mondiad; echt (eerste tik) is alleen meting.',
  ],
  overnemen: [
    'Lees eerst deze pagina, dan de algemene handover https://hjdk-api-henq.vercel.app/api/mm/handover (project wam) en de skills campagnes-henkjan en leerlus. Alle beschermde adressen lees je met de Vercel-tool web_fetch_vercel_url.',
    'Repos: henkjandekrijger-glitch/hjdk-api (WAM-code: api/wam.js, lib/wam.js, lib/wam-leer.js, lib/wam-push.js, lib/wam-post.js, lib/wam-sms.js, lib/wam-hooks.js, lib/wam-flow.js, lib/werking.js, deze pagina lib/wam-overdracht.js), henkjandekrijger-glitch/whatsappp-mcp (src/wam.js, src/wam2.js, src/cur.js, handover/HANDOVER.md, npm test), henkjandekrijger-glitch/propellerads-mcp (lib/budget.ts WAM_UIT en WAM_VONK, lib/wamkopie.ts, docs/campagne-skill.md).',
    'Werkwijze hjdk-api: git pull --rebase, commit met expliciete bestandsnamen, push naar main (Vercel rolt uit). Verander je hoe WAM werkt: in dezelfde commit lib/werking.js (WAM_WERKING, WERKING_DATUM) en zo nodig VAST in lib/wam-overdracht.js bijwerken. Werklog: /api/mm/handover?log=<wat>&wie=wam-chat.',
    'Werkwijze whatsappp-mcp: handover/HANDOVER.md (sectie en logboekregel) en VERSION in src/server.js bijwerken, npm test (na npm ci --ignore-scripts) voor je pusht. Push naar main deployt Railway. /handover.json is openbaar: nooit nummers, namen of berichten.',
    'Lokaal testen: redis-server --port 6390, dan een node-script met process.env.KV_REDIS_URL = redis://127.0.0.1:6390 dat lib/wam.js importeert en startSessie, zeg, waIn of waUit aanroept (voorbeelden van eerdere chats: zelfde patroon). Zonder AI-sleutel volgt de chat de regels en vaste vragen.',
    'Stand lezen (beschermde host): op=stand (eigenaarspagina), op=tellers&dagen=2, op=kost, op=rapport, op=gesprekken, op=exp, op=pad, op=wastand, op=herkomst, op=stadstand&land=CA, op=hookscore. WhatsApp-koppeling: https://whatsappp-mcp-production.up.railway.app/handover.json. Campagnes: Henkjans PropellerAds-MCP api_get /adv/campaigns?status[]=6.',
    'Schakelaars (env in Vercel, team henq): WAM_WA_DIRECT=1 (oud gedrag: ook berichten zonder code beantwoorden), WAM_DIRECT_UIT=1 (contact delen uit), WAM_DIRECT_MAX (standaard 3), WAM_WA_PER_DAG (standaard 40), WAM_WA_DOOR=1 (doorsturen vanuit WhatsApp), WAM_WA_START=aan. WhatsApp-nummer aan of uit: op=watweede&aan=1&nr=<nummer> of aan=0. Sms gaat vanzelf aan met TWILIO_ACCOUNT_SID en TWILIO_AUTH_TOKEN (of BIRD_* of TEXTBELT_KEY) als gedeelde team-variabele; India alleen met WAM_SMS_IN=1.',
    'Rapporteren aan Henkjan: gewoon Nederlands, kort, alleen wat bewoog, met ingevulde cijfers. Het rapport hoort in de chat, niet via Telegram.',
  ],
  grenzen: [
    'Henkjans eigen nummer (eindigt op 630) nooit voor WAM of bots; BOTS_EIGEN_NUMMER nooit zetten.',
    'Geen koude eerste WhatsApp-berichten, geen links in de eerste 3 berichten, geen contactkaarten, menselijk tempo; hoogstens 40 per dag en 15 nieuwe gesprekken per dag (3 voor IN, PK, BD, NG); WAM appt nooit uit zichzelf.',
    'Campagnes: hoogstens $10 per dag per campagne, WAM-dagplafond $40 in de budgetwacht; nu alles uit tot Henkjans woord.',
    'AI-kosten: hoogstens $10 per UTC-dag voor chat, zoeken en leerronde samen.',
    'Nooit sleutels of omgevingswaarden tonen of in code zetten; nooit nummers of gesprekken in openbare pagina\'s.',
    'Geen geld als beloning, geen verzonnen aantallen, geen nep-urgentie; nooit helpen een bepaalde privépersoon te vinden.',
  ],
  open: [
    'Campagnes weer aan? Wacht op Henkjan. Als ja: begin klein (één lijn, $10 per dag), meet direct_deel en wa_deel_ja naast dialoog.',
    'Sms: wacht op een sleutel (Twilio heeft Henkjan al voor Nexy). Daarna gaat het vanzelf aan.',
    'Contact delen meten: hoeveel keer een nummer gedeeld werd (direct_deel), hoeveel ja op de deelvraag in WhatsApp (wa_deel_ja tegen wa_deel_vraag), en of de check-in na 24 uur bevestigt dat ze elkaar spraken.',
    '3 WhatsApp-gesprekken hebben een bericht in de wachtrij (wam:waq); dat gaat pas mee als die mensen zelf weer schrijven.',
    'Oude WhatsApp-gesprekken van voor 14 nov 23:27 UTC (zonder waZorg) krijgen geen antwoord meer; STOP werkt wel.',
    'Nog niet gebouwd: selfie-check bij meer risico, sms-code ter controle, besloten kringen eerst (privé-WAM voor kerken, clubs, bedrijven), spraakbericht.',
    'Open vraag aan Henkjan van 14 nov: CA MATCH als tweede vonk (nooit beantwoord, nu vervallen door de stop).',
  ],
  werklog: [
    '15 nov: wa_uit_wacht telt een wachtende chat eenmaal per dag (was elke poll).',
    '15 nov: propellerads-mcp bbc566c, WAM_VONK leeg; 12136847 gestopt.',
    '15 nov: hjdk-api b3c2d77 en whatsappp-mcp 1.63, contact delen in plaats van doorsturen (DIRECT, deelvraag op WhatsApp, op=wanr).',
    '14 nov: hjdk-api 7748b18 en whatsappp-mcp 1.62, alleen reageren op een zorgvuldig verstuurd bericht.',
    '14 nov: hjdk-api 248398c en whatsappp-mcp 1.61, WhatsApp terug alleen voor wie serieus is, met de lessen van de blokkade.',
    '14 nov: hjdk-api 84b4d59 en c7e526c, kortste weg (kringen, minste stappen, topverbinders).',
    '14 nov: hjdk-api 6332f96 en 720e4e8, vertrouwen eerst (10 mechanismen) en push als meldkanaal.',
  ],
};

const SLEUTEL_TELLERS = [
  ['geladen', 'chat geladen'], ['betaald', 'via advertentie'], ['organisch', 'zonder advertentie'], ['echt', 'echt in gesprek'], ['dialoog', 'echte dialoog'],
  ['zoektocht', 'zoektochten vastgelegd'], ['aanbod', 'aanbiedingen vastgelegd'], ['verbind', 'op Connect me getikt'], ['direct_deel', 'contact meteen gedeeld'],
  ['beide_ja', 'beiden ja'], ['nr_uitgewisseld', 'nummers uitgewisseld'], ['contact', 'contact achtergelaten'], ['contact_push', 'melding op telefoon aangezet'],
  ['eigen_door', 'vraag gedeeld met eigen kring'], ['kring_ping', 'kring gepingd'], ['wa_in', 'WhatsApp-berichten binnen'], ['wa_stil_zonder_code', 'WhatsApp stil: geen code'],
  ['wa_stil_niet_serieus', 'WhatsApp stil: niet serieus'], ['wa_stil_code', 'WhatsApp stil: onbekende code'], ['wa_stil_oud', 'WhatsApp stil: oud gesprek'],
  ['wa_deel_vraag', 'deelvraag gesteld'], ['wa_deel_ja', 'ja op deelvraag'], ['wa_deel_nr', 'nummer gedeeld na ja'], ['match_slaap', 'match met iemand die er niet is'],
];

async function live() {
  const uit = { tijd: new Date().toISOString() };
  try { uit.whatsapp = await W.waStand(); } catch (e) { uit.whatsapp = { fout: String(e.message || e).slice(0, 80) }; }
  try {
    const t = await W.tellers(2), dagen = Object.keys(t).sort().reverse();
    uit.tellers = dagen.map((d) => ({ dag: d, waarden: SLEUTEL_TELLERS.filter(([k]) => N(t[d] && t[d][k])).map(([k, l]) => ({ k, l, n: N(t[d][k]) })) }));
  } catch (e) { uit.tellers = []; }
  try { const k = await W.kostStand(2); uit.kosten = k.map((x) => ({ dag: x.dag, usd: x.totaal, plafond: x.plafond })); } catch (e) { uit.kosten = []; }
  try {
    const e = await W.expStand({ sluit: false });
    uit.proeven = { open: e.open, beoordeeld: e.beoordeeld, klopt_pct: e.klopt_pct, advies: e.advies, lijst: (e.lijst || []).slice(0, 12).map((x) => ({ id: x.id, soort: x.soort, wat: String(x.wat || x.hyp || '').slice(0, 140), status: x.status, uitslag: x.uitslag || '', lift: x.lift })) };
  } catch (e) { uit.proeven = null; }
  try { uit.kortste_weg = await W.padStand('CA'); } catch (e) { uit.kortste_weg = null; }
  return uit;
}

function md(v, l) {
  const r = [];
  r.push('# We Are Many (WAM): overdracht', '', 'Bijgewerkt: vast deel ' + OVERDRACHT_DATUM + ', werking ' + WERKING_DATUM + ', live stand ' + l.tijd.slice(0, 16).replace('T', ' ') + ' UTC.', '');
  const lijst = (kop, xs) => { r.push('## ' + kop, ''); for (const x of xs) r.push('- ' + x); r.push(''); };
  lijst('Wat het is', v.wat);
  lijst('Stand (vast)', v.stand_vast);
  r.push('## Stand (live)', '');
  const w = l.whatsapp || {};
  r.push('- WhatsApp-koppeling: ' + (w.aangesloten ? 'aangesloten' : 'niet aangesloten') + ', nummer ' + (w.nummer || '-') + ', knop ' + (w.knop_aan ? 'aan' : 'uit') + ', laatst gezien ' + (w.laatst_gezien_min != null ? w.laatst_gezien_min + ' min geleden' : '-') + ', chats met wachtend bericht ' + N(w.wachtrij_chats) + ', versie koppeling ' + (w.versie || '-') + '.');
  for (const k of l.kosten || []) r.push('- AI-kosten ' + k.dag + ': $' + k.usd + ' van $' + k.plafond + '.');
  for (const d of l.tellers || []) r.push('- ' + d.dag + ': ' + (d.waarden.length ? d.waarden.map((x) => x.l + ' ' + x.n).join(', ') : 'niets') + '.');
  if (l.kortste_weg) r.push('- Kortste weg Canada deze week: ' + ((l.kortste_weg.top || []).length) + ' verbinders in de top.');
  if (l.proeven) { r.push('- Proeven: ' + N(l.proeven.open) + ' open, ' + N(l.proeven.beoordeeld) + ' beoordeeld' + (l.proeven.klopt_pct != null ? ' (' + l.proeven.klopt_pct + '% raak)' : '') + '. Advies: ' + (l.proeven.advies || '-') + '.'); for (const p of l.proeven.lijst || []) r.push('  - ' + p.id + ' (' + (p.soort || '') + ', ' + p.status + (p.uitslag ? ', ' + p.uitslag : '') + '): ' + p.wat); }
  r.push('');
  lijst('Besluiten van Henkjan (nieuwste eerst)', v.besluiten);
  lijst('Hoe het werkt', v.hoe);
  lijst('Overnemen in een nieuwe chat', v.overnemen);
  lijst('Harde grenzen', v.grenzen);
  lijst('Open punten', v.open);
  lijst('Werklog (nieuwste eerst)', v.werklog);
  r.push('## Volledige werking (lib/werking.js, WAM_WERKING, chronologisch)', '', WAM_WERKING, '');
  return r.join('\n');
}

const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function html(tekst) {
  const regels = tekst.split('\n'); const o = []; let inUl = 0;
  const sluit = () => { while (inUl > 0) { o.push('</ul>'); inUl--; } };
  for (const r of regels) {
    if (r.startsWith('# ')) { sluit(); o.push('<h1>' + esc(r.slice(2)) + '</h1>'); }
    else if (r.startsWith('## ')) { sluit(); if (r.includes('Volledige werking')) o.push('<details><summary><h2>' + esc(r.slice(3)) + '</h2></summary>'); else o.push('<h2>' + esc(r.slice(3)) + '</h2>'); }
    else if (r.startsWith('  - ')) { if (inUl < 2) { o.push('<ul>'); inUl = 2; } o.push('<li>' + esc(r.slice(4)) + '</li>'); }
    else if (r.startsWith('- ')) { if (inUl === 2) { o.push('</ul>'); inUl = 1; } if (inUl < 1) { o.push('<ul>'); inUl = 1; } o.push('<li>' + esc(r.slice(2)) + '</li>'); }
    else if (r.trim()) { sluit(); o.push('<p>' + esc(r) + '</p>'); }
  }
  sluit(); if (tekst.includes('## Volledige werking')) o.push('</details>');
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>WAM overdracht</title><style>body{font-family:Inter,system-ui,sans-serif;max-width:860px;margin:0 auto;padding:24px 18px 60px;color:#111;line-height:1.55;font-size:16px}h1{font-size:28px;margin:0 0 6px}h2{font-size:20px;margin:28px 0 8px;color:#2B47C4;display:inline-block}li{margin:4px 0}ul ul{margin:4px 0}p{margin:6px 0}details{margin-top:28px}summary{cursor:pointer}details p{white-space:pre-wrap;font-size:14px;color:#333}@media(prefers-color-scheme:dark){body{background:#111;color:#eee}h2{color:#8FA3F5}details p{color:#ccc}}</style></head><body>' + o.join('\n') + '<p style="margin-top:32px;color:#666;font-size:13px">JSON: ?op=overdracht&amp;format=json · Tekst: ?op=overdracht&amp;format=md</p></body></html>';
}

export async function wamOverdracht(format) {
  const l = await live();
  if (format === 'json') return { type: 'json', body: { project: 'wam', bijgewerkt: OVERDRACHT_DATUM, werking_datum: WERKING_DATUM, ...VAST, live: l, werking: WAM_WERKING } };
  const t = md(VAST, l);
  if (format === 'md') return { type: 'md', body: t };
  return { type: 'html', body: html(t) };
}
