// Lasting Change: "Why didn't it work this year?" op lastingchange.works/why-it-didnt-work, met de lerende chat van de keuzehulpen.
// Henkjan 22 nov 2026: "Ik wil hier de lerende chat op waarom het weer niet gelukt is dit jaar en we geven dan advies . De keuzehulp chat maar
// dan over je eigen leven ." en daarna "Nee niet de goede kijk bij keuzehulpen en gebruik die die is veel verder ontwikkeld ."
// Dus: geen eigen chat, maar kzuxBlok (lib/kzux.js) met de server van de keuzehulpen (lib/kzchat.js, markt us, slug lc-waarom). Die leert al:
// proef per bezoeker (start, pillflow, stijl), cache per pill-pad, intenties per persoon, volgen en mail, doorpraten per antwoord.
// De zeven redenen zijn de situatie-pills; de kennis van de chat staat in chatItems() hieronder (in lib/kzchat.js alle('us')).
// Pas live na Henkjans ok (kv lc:w:live = 1, op=lcwaaromlive op de beschermde host); tot dan alleen te zien met ?concept=1 (noindex).
import { esc } from './bs.js';
import { LC } from './bs-data.js';
import { kzuxBlok } from './kzux.js';
import { schil, kopen, BASE, BEDRAG } from './lcfunnel.js';

export const SLUG = 'why-it-didnt-work';
export const CHAT_SLUG = 'lc-waarom';

// [id, pill, wat er misging, oplossing, deel van het werkboek]
export const REDENEN = [
  ['teveel', 'I tried to change too much at once', 'Your plan only worked on a great day. Every extra goal splits the little energy you have on a hard day, so the first hard week takes all of it down.', 'Pick one habit and make it so small you cannot say no. You grow it once it runs on its own.', 'Week 1, Start tiny, and Day 0, where you pick one habit and set it up.'],
  ['druk', 'Life got busy', 'The habit had no fixed spot in your day, so it had to compete with everything else, and everything else is louder.', 'Tie it to something you already do every day: after coffee, after brushing your teeth, after you park the car.', 'Day 0, where you choose the exact moment, and the contract you sign with yourself.'],
  ['motivatie', 'I lost motivation', 'You ran on motivation. It peaks on day one and fades within weeks for almost everyone. That is not a flaw in you, it is how motivation works.', 'Build something that works on low days: a fixed moment, a tiny version and a two-minute check-in that keeps you honest.', 'The daily two-minute check-in and the Why it works page behind every exercise.'],
  ['slechtedag', 'One bad day ended it', 'All or nothing. One missed day felt like failure, so you stopped. In the 2010 habit study by Lally and colleagues, missing a single day did not materially change how the habit formed.', 'Never miss twice. Decide now what the bad-day version is, so a bad day becomes a small day instead of the last day.', 'The bad-day card in the back of the workbook, made for exactly that day.'],
  ['bijhouden', 'I did not keep track', 'Progress you cannot see is easy to drift away from. Without a streak in front of you, skipping one day costs nothing.', 'Make it visible: one mark a day on a card you see every morning.', 'The 30-day card on the first page and the tracker that runs to day 120.'],
  ['alleen', 'Nobody kept me accountable', 'A promise only you know about is easy to renegotiate at 9 pm.', 'Write it down as a contract with yourself, review it once a week and tell one person what you are doing.', 'The contract on Day 0 and the weekly reviews on days 7, 14, 21 and 28.'],
  ['hoe', 'I did not know where to start', 'You had a goal but no first step, so every day started with deciding what to do, and deciding is tiring.', 'Use a plan where each day has one small task, so there is nothing to decide.', 'The 30 days, one short exercise each, from Start tiny to Make it me.'],
];

const VRAGEN = [
  ['Why did my New Year’s resolution not work?', 'For most people it is one of seven reasons: too much at once, life got busy, motivation faded, one bad day ended it, no tracking, nobody to keep them accountable, or no clear first step. Each has its own fix. The chat above helps you find yours.'],
  ['Is it too late to start this year?', 'No. Day 0 can be today. A habit started in December has its 66 days behind it by February, while most January starts have already stopped.'],
  ['What do I do after this?', 'Do one step today, so small it feels silly. If you want the full 30-day plan with a daily check-in and a bad-day card, that is the Lasting Change Workbook.'],
  ['How long does it take to build a habit?', 'In the 2010 study by Lally and colleagues the median was 66 days, with a wide range from 18 to 254 days. That is why the workbook runs 30 days and then continues to day 66.'],
];

// Kennis voor de chat van de keuzehulpen (lib/kzchat.js, markt us). pad absoluut, zoals nexy.help.
export function chatItems() {
  const prijs = `Paperback $${LC.p} and hardcover $${LC.hc.p} on Amazon` + (BEDRAG ? `; PDF $${BEDRAG} on lastingchange.works when available` : '');
  return [{
    slug: CHAT_SLUG, pad: BASE + '/', term: 'your year', title: 'Lasting Change Workbook',
    kort: 'This page is not a buying guide. You are a coach in a real conversation with someone whose change did not work this year. Build the conversation first, sell last. Your first two answers: no workbook, no price, no book title, pagina empty. Mirror what you heard in one or two warm sentences without blame, then ask ONE question that digs into what actually happened (the moment it stopped, what a normal day looks like, what they tried), with 2 or 3 short tappable answers in opties and the question in vraag. Once you know what really went wrong (usually from the third answer on): name it, give the fix and one step for today so small they cannot say no, and ask if they want to try it. Only after that, or when they ask how to keep going, mention the one part of the Lasting Change Workbook that fits, once, without a price unless they ask, and put this slug in pagina. Never more than 3 short sentences. For health problems say to talk to a doctor. If someone mentions harming themselves, do not sell anything: point them to 988 (call or text, US) or findahelpline.com.',
    uitleg: `The Lasting Change Workbook (2027 edition, ${LC.n} pages): one habit, 30 days, a two-minute daily check-in, a bad-day card, a 30-day card, a contract on Day 0, weekly reviews on days 7, 14, 21 and 28, then days 31 to 66 and a tracker to day 120. Rated ${LC.r} out of 5 from ${LC.c} ratings on Amazon. ${prijs}. The seven reasons a change falls apart are in the FAQ below, each with what went wrong, the fix and the workbook part.`,
    faq: REDENEN.map(r => ({ q: 'Reason: ' + r[1], a: `${r[2]} Fix: ${r[3]} In the workbook: ${r[4]}` })).concat(VRAGEN.map(([q, a]) => ({ q, a }))),
  }];
}

export function renderWaarom(c) {
  const chat = kzuxBlok({ alleenChat: true, taal: 'us', site: 'kzuxlc', slug: CHAT_SLUG, term: 'your year', shop: '', prods: [], wie: 'Coach', dialoog: true, geenVolg: true, geenGeheugen: true, voortg: '',
    kop: 'Tell me what happened', ph: 'Type your answer', doorVraag: 'Tell me a bit more: what happened on the day it slipped?',
    stappen: [
      { id: 'lcdoel', f: 'doel', so: 'lc-doel', zin: 'This year I wanted to', v: 'What did you want to change this year?', k: ['Exercise more', 'Eat better or lose weight', 'Save money', 'Quit a bad habit', 'Sleep better', 'Finish a project'], n: 6 },
      { id: 'lcfase', f: 'fase', so: 'lc-fase', zin: 'How far I got', v: 'How far did you get?', k: ['I never really started', 'A few days', 'A few weeks', 'A few months'] },
      { id: 'lcreden', f: 'reden', so: 'lc-reden', zin: 'What stopped me', v: 'What stopped you, honestly?', k: REDENEN.map(r => r[1]), n: 7 },
    ],
    adv: 'Do not sell anything yet. Tell me in one or two sentences what you hear, then ask me one question about what actually happened, with 2 or 3 short answers I can tap.',
    opties: REDENEN.map((r, i) => ({ qi: 0, oi: i, label: r[1], q: 'This year my change did not work out.' })),
    faq: VRAGEN.map(([q, a]) => ({ q, a })), t: { tik: 'Tap what fits you, or tell me what happened. We figure out what went wrong, then what to do about it.' } });
  const body = `<div class="kopblok"><p class="eb">Free, two minutes</p><h1>Why didn’t it work this year?</h1></div>`
    + `<p class="intro">Tell the chat what stopped you. You get what really went wrong, the fix, and one step you can take today. No email needed.</p>`
    + chat
    + `<section class="stack"><h2>The seven reasons a change falls apart, and the fix for each</h2>${REDENEN.map(r => `<div class="reden"><h3>${esc(r[1])}</h3><p>${esc(r[2])}</p><p><b>Fix:</b> ${esc(r[3])}</p></div>`).join('')}</section>`
    + `<section class="lc-held"><div class="stack"><p class="eb">The workbook behind the fixes</p><h2>Lasting Change Workbook</h2><p>One habit, 30 days, a two-minute daily check-in and a bad-day card. ${LC.r} out of 5 from ${LC.c} ratings on Amazon.</p>${kopen(c, 'check')}</div><a class="cov" href="${c.L('')}"><img src="https://m.media-amazon.com/images/I/${LC.i}._SL900_.jpg" alt="Lasting Change Workbook, book cover" width="600" height="900" loading="lazy" decoding="async"></a></section>`
    + `<section class="stack"><h2>Questions</h2><div class="faq">${VRAGEN.map(([v, a]) => `<div><h3>${esc(v)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`
    + `<nav class="meer"><p class="eb">Read next</p><a href="${c.L('how-to-stick-to-new-years-resolutions')}">How to stick to your New Year’s resolutions</a><a href="${c.L('guides')}">All guides</a></nav>`
    + `<style>.reden{border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:6px}</style>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: VRAGEN.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return schil(c, { slug: SLUG, title: 'Why Didn’t My Resolution Work This Year? Find Out in 2 Minutes', desc: 'Tell the chat what stopped you this year and get the real reason, the fix that works and one step for today. Free, no email needed.', body, ld, noindex: !c.waaromLive });
}
