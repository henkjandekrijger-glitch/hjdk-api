// Lasting Change: lerende chat "Why didn't it work this year?" op lastingchange.works/why-it-didnt-work.
// Henkjan 22 nov 2026: "Ik wil hier de lerende chat op waarom het weer niet gelukt is dit jaar en we geven dan advies . De keuzehulp chat maar
// dan over je eigen leven ."
// Werking: drie tikvragen (wat wilde je veranderen, hoe ver kwam je, wat hield je tegen), dan een diagnose met de oplossing, één stap voor
// vandaag, het deel van het werkboek dat dit oplost en een live vergelijking met iedereen die de check deed (alleen vanaf genoeg antwoorden,
// nooit nullen). Daarna kan de bezoeker vertellen wat er echt gebeurde: het model (Haiku, kort) antwoordt persoonlijk en deelt de tekst in bij
// een reden; nieuwe redenen komen in het logboek en worden nieuwe tikknoppen en artikelonderwerpen.
// Leren: elke check telt per doel, fase en reden (kv lc:w:tel en lc:w:dag:<dag>); proef op de knop na het advies (arm a: oplossing, arm b:
// Day 0 vandaag), winnaar vanaf 150 vertoningen per arm en 30% verschil in kliks (kv lc:w:winnaar).
// Pas live na Henkjans ok (kv lc:w:live = 1, op=lcwaaromlive op de beschermde host); tot dan alleen te zien met ?concept=1 (noindex).
import { esc } from './bs.js';
import { LC } from './bs-data.js';
import { schil, kopen, BASE, BEDRAG } from './lcfunnel.js';

export const SLUG = 'why-it-didnt-work';
export const MIN_N = 30; // vanaf zoveel checks tonen we een vergelijking, per doel vanaf MIN_DOEL
export const MIN_DOEL = 20;

export const DOELEN = [
  ['fit', 'Exercise more', 'put on your shoes and walk for five minutes'],
  ['gezond', 'Get healthier or lose weight', 'drink one glass of water before lunch'],
  ['geld', 'Save money or pay off debt', 'move $5 to savings right after you get paid'],
  ['stoppen', 'Cut back on drinking, smoking or my phone', 'put your phone in another room for the first 20 minutes of the evening'],
  ['slaap', 'Sleep better', 'set an alarm that tells you to start getting ready for bed'],
  ['leren', 'Learn something or finish a project', 'open the project and work on it for two minutes'],
  ['anders', 'Something else', 'do the smallest possible version of it for two minutes'],
];
export const FASEN = [
  ['nooit', 'I never really started'],
  ['dagen', 'A few days'],
  ['weken', 'A few weeks'],
  ['maanden', 'A few months, then it faded'],
  ['wankel', 'I am still going, but it is shaky'],
];
// [id, knop, diagnose, oplossing, deel van het werkboek]
export const REDENEN = [
  ['teveel', 'I tried to change too much at once', 'Your plan only worked on a great day. Every extra goal splits the little energy you have on a hard day, so the first hard week takes all of it down.', 'Pick one habit and make it so small you cannot say no. You grow it once it runs on its own.', 'Week 1, Start tiny, and Day 0, where you pick one habit and set it up.'],
  ['druk', 'Life got busy', 'The habit had no fixed spot in your day, so it had to compete with everything else, and everything else is louder.', 'Tie it to something you already do every day: after coffee, after brushing your teeth, after you park the car.', 'Day 0, where you choose the exact moment, and the contract you sign with yourself.'],
  ['motivatie', 'I lost motivation', 'You ran on motivation. It peaks on day one and fades within weeks for almost everyone. That is not a flaw in you, it is how motivation works.', 'Build something that works on low days: a fixed moment, a tiny version and a two-minute check-in that keeps you honest.', 'The daily two-minute check-in and the Why it works page behind every exercise.'],
  ['slechtedag', 'One bad day ended it', 'All or nothing. One missed day felt like failure, so you stopped. In the 2010 habit study by Lally and colleagues, missing a single day did not materially change how the habit formed.', 'Never miss twice. Decide now what the bad-day version is, so a bad day becomes a small day instead of the last day.', 'The bad-day card in the back of the workbook, made for exactly that day.'],
  ['bijhouden', 'I did not keep track', 'Progress you cannot see is easy to drift away from. Without a streak in front of you, skipping one day costs nothing.', 'Make it visible: one mark a day on a card you see every morning.', 'The 30-day card on the first page and the tracker that runs to day 120.'],
  ['alleen', 'Nobody kept me accountable', 'A promise only you know about is easy to renegotiate at 9 pm.', 'Write it down as a contract with yourself, review it once a week and tell one person what you are doing.', 'The contract on Day 0 and the weekly reviews on days 7, 14, 21 and 28.'],
  ['hoe', 'I did not know where to start', 'You had a goal but no first step, so every day started with deciding what to do, and deciding is tiring.', 'Use a plan where each day has one small task, so there is nothing to decide.', 'The 30 days, one short exercise each, from Start tiny to Make it me.'],
];
const FASE_TIP = {
  nooit: 'Starting is the hardest part, so make Day 0 almost silly in size.',
  dagen: 'Most plans that stop after a few days were set up for a perfect week.',
  weken: 'Weeks two and three are where motivation drops for almost everyone. That is the moment a system has to take over.',
  maanden: 'You were closer than it feels. The habit was forming; it needed a plan for the moment it slipped.',
  wankel: 'Protect what you have: shrink it on hard days instead of skipping.',
};
export const naam = (lijst, id) => (lijst.find(x => x[0] === id) || [])[1] || '';

// Advies uit de drie antwoorden en de stand (tel: hash lc:w:tel als object). Geeft alleen tekst terug; de pagina zet het met textContent.
export function advies({ doel, fase, reden, arm }, tel = {}) {
  const r = REDENEN.find(x => x[0] === reden) || REDENEN[2], d = DOELEN.find(x => x[0] === doel) || DOELEN[DOELEN.length - 1];
  const n = +tel.n || 0, uit = { diagnose: r[2], oplossing: r[3], vandaag: `Today: ${d[2]}. That is the whole task. Tick it off, and do it again tomorrow.`, deel: r[4], fase: FASE_TIP[fase] || '', bench: [] };
  if (n >= MIN_N) {
    const p = Math.round(100 * (+tel['r:' + r[0]] || 0) / n);
    if (p >= 1) uit.bench.push(`${p}% of the ${n} people who took this check named the same reason. You are not the exception.`);
    const nd = +tel['d:' + d[0]] || 0;
    if (nd >= MIN_DOEL && d[0] !== 'anders') {
      const top = REDENEN.map(x => [x, +tel['dr:' + d[0] + ':' + x[0]] || 0]).sort((a, b) => b[1] - a[1])[0];
      if (top[1] > 0) uit.bench.push(`Among people who wanted to ${d[1].toLowerCase()}, the most common reason was: ${top[0][1].toLowerCase()} (${Math.round(100 * top[1] / nd)}%).`);
    }
  }
  uit.knop = arm === 'b' ? 'Start Day 0 today with the workbook' : 'Get the workbook that fixes this';
  return uit;
}

// Systeemprompt voor het persoonlijke antwoord (vaste tekst, gecachet). Antwoord als JSON { a, reden } zodat de vrije tekst ook leert.
export const SYSTEEM = `You are the coach behind the Lasting Change Workbook (2027 edition, ${LC.n} pages: one habit, 30 days, a two-minute daily check-in, a bad-day card, a 30-day card, a contract with yourself on Day 0, weekly reviews on days 7, 14, 21 and 28, then days 31 to 66 and a tracker to day 120).
Someone tells you why their change did not work this year. Answer in English in 60 to 110 words: name what really went wrong in one sentence, without blame; give one concrete step they can do today, sized so small they cannot say no; if it fits, name the one part of the workbook that handles this. Warm and direct, like a friend who knows habits. No dashes as punctuation, no lists, no headings, no emojis. Never invent numbers or studies. No medical, legal or financial advice beyond everyday habits; for health problems, say to talk to a doctor.
Then classify their main reason as one of: ${REDENEN.map(r => r[0]).join(', ')}, or a new short label in lowercase English (max 4 words) if none fits.
Reply with JSON only: {"a":"<your answer>","reden":"<id or new label>"}`;

export const ZORG = /suicid|kill myself|end my life|self.?harm|hurt myself|want to die|no reason to live/i;
export const ZORG_ANTWOORD = 'Thank you for telling me. This sounds heavier than a habit, and you deserve real support right now. In the US you can call or text 988 any time to talk to someone. Outside the US, findahelpline.com lists a free line near you. The habits can wait.';

const CSS = `
.chat{border:1px solid var(--ink);border-radius:20px;padding:18px;display:flex;flex-direction:column;gap:12px;min-height:260px}
.chat .b{max-width:88%;padding:10px 14px;border-radius:16px;line-height:1.5}
.chat .zij{align-self:flex-start;border:1px solid var(--ink);background:#fff}
.chat .ik{align-self:flex-end;background:var(--ink);color:#fff}
.chat .keus{display:flex;flex-wrap:wrap;gap:8px}.chat .keus .pill{min-height:42px;padding:8px 16px}
.chat .stuk{display:flex;flex-direction:column;gap:6px}.chat .stuk b{font-weight:700}
.chat form{display:flex;gap:8px}.chat textarea{flex:1;font:inherit;border:1px solid var(--ink);border-radius:16px;padding:10px 14px;min-height:46px;resize:vertical;color:var(--ink)}
.reden{border-top:1px solid var(--line);padding-top:14px;display:flex;flex-direction:column;gap:6px}
`;

const chatJs = (api, koopUrl, pdf) => `(function(){var D=document,C=D.getElementById('chat');if(!C)return;C.innerHTML='';
var DO=${JSON.stringify(DOELEN.map(x => [x[0], x[1]]))},FA=${JSON.stringify(FASEN)},RE=${JSON.stringify(REDENEN.map(x => [x[0], x[1]]))};
var sid='';try{sid=sessionStorage.getItem('lcw')||'';if(!sid){sid=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('lcw',sid)}}catch(e){sid=Math.random().toString(36).slice(2)}
var st={sid:sid,arm:Math.random()<.5?'a':'b'};
function el(t,c,x){var e=D.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function zeg(x,ik){var b=el('div','b '+(ik?'ik':'zij'),x);C.appendChild(b);b.scrollIntoView({block:'nearest',behavior:'smooth'});return b}
function vraag(t,lijst,k,dan){zeg(t);var w=el('div','keus');lijst.forEach(function(o){var p=el('button','pill',o[1]);p.type='button';p.onclick=function(){w.remove();zeg(o[1],1);st[k]=o[0];dan()};w.appendChild(p)});C.appendChild(w)}
function post(o,f){fetch(${JSON.stringify(api)},{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(o)}).then(function(r){return r.json()}).then(f).catch(function(){f(null)})}
function stuk(kop,x){if(!x)return;var s=el('div','b zij stuk');s.appendChild(el('b','',kop));s.appendChild(el('span','',x));C.appendChild(s)}
function advies(a){if(!a||!a.diagnose){zeg('Something went wrong on our side. The seven reasons and their fixes are right below this chat.');return}if(a.arm)st.arm=a.arm;
stuk('What went wrong',a.diagnose+(a.fase?' '+a.fase:''));stuk('The fix',a.oplossing);stuk('Your step for today',a.vandaag);(a.bench||[]).forEach(function(x){stuk('Everyone else',x)});stuk('Where the workbook helps',a.deel);
var k=el('a','btn',a.knop);k.href=${JSON.stringify(koopUrl)};${pdf ? "k.setAttribute('data-koop','chat');" : "k.rel='noopener';"}k.onclick=function(){try{navigator.sendBeacon(${JSON.stringify(api)},JSON.stringify({ev:'klik',sid:sid,arm:st.arm}))}catch(e){}};C.appendChild(k);
zeg('Want a personal answer? Tell me what actually happened, in your own words.');var f=el('form');var t=el('textarea');t.rows=2;t.maxLength=600;t.placeholder='For example: I started running in January, then work got crazy in March...';var s=el('button','btn','Send');s.type='submit';f.appendChild(t);f.appendChild(s);C.appendChild(f);
f.onsubmit=function(e){e.preventDefault();var x=t.value.trim();if(x.length<8){t.focus();return}f.remove();zeg(x,1);var w=zeg('Reading what you wrote...');post({sid:sid,doel:st.doel,fase:st.fase,reden:st.reden,arm:st.arm,tekst:x},function(r){w.textContent=(r&&r.a)||'Thank you. The steps above are the best place to start.'})}}
vraag('What did you want to change this year?',DO,'doel',function(){vraag('How far did you get?',FA,'fase',function(){vraag('What stopped you, honestly?',RE,'reden',function(){var w=zeg('Comparing with everyone who took this check...');post(st,function(a){w.remove();advies(a)})})})})})();`;

export function renderWaarom(c, tel = {}) {
  const n = +tel.n || 0;
  const top = n >= MIN_N ? REDENEN.map(r => [r, +tel['r:' + r[0]] || 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 4) : [];
  const api = '/api/bs?site=lc&op=lcchat';
  const koop = c.pdf ? c.L('') + '#kopen' : (c.go ? c.go(LC.a) : 'https://www.amazon.com/dp/' + LC.a);
  const vragen = [
    ['Why did my New Year’s resolution not work?', 'For most people it is one of seven reasons: too much at once, life got busy, motivation faded, one bad day ended it, no tracking, nobody to keep them accountable, or no clear first step. Each has its own fix. The check above tells you which one was yours.'],
    ['Is it too late to start this year?', 'No. Day 0 can be today. A habit started in December has its 66 days behind it by February, while most January starts have already stopped.'],
    ['What do I do after this check?', 'Do the one step for today that the check gives you, even if it feels too small. If you want the full 30-day plan with a daily check-in and a bad-day card, that is the Lasting Change Workbook.'],
  ];
  const body = `<div class="kopblok"><p class="eb">Free 2-minute check</p><h1>Why didn’t it work this year?</h1></div>`
    + `<p class="intro">Answer three questions and find out what really stopped you, what fixes it, and the one step you can take today. No email needed.</p>`
    + `<div class="chat" id="chat" aria-live="polite"><p>Turn on JavaScript to take the check. The seven reasons and their fixes are below.</p></div>`
    + (top.length ? `<section class="stack"><h2>What ${n} people told us</h2><ul class="k">${top.map(([r, k]) => `<li><b>${Math.round(100 * k / n)}%</b> ${esc(r[1].toLowerCase())}</li>`).join('')}</ul><p>Live numbers from everyone who took this check.</p></section>` : '')
    + `<section class="stack"><h2>The seven reasons a change falls apart, and the fix for each</h2>${REDENEN.map(r => `<div class="reden"><h3>${esc(r[1])}</h3><p>${esc(r[2])}</p><p><b>Fix:</b> ${esc(r[3])}</p></div>`).join('')}</section>`
    + `<section class="lc-held"><div class="stack"><p class="eb">The workbook behind the check</p><h2>Lasting Change Workbook</h2><p>One habit, 30 days, a two-minute daily check-in and a bad-day card. ${LC.r} out of 5 from ${LC.c} ratings on Amazon.</p>${kopen(c, 'check')}</div><a class="cov" href="${c.L('')}"><img src="https://m.media-amazon.com/images/I/${LC.i}._SL900_.jpg" alt="Lasting Change Workbook, book cover" width="600" height="900" loading="lazy" decoding="async"></a></section>`
    + `<section class="stack"><h2>Questions</h2><div class="faq">${vragen.map(([v, a]) => `<div><h3>${esc(v)}</h3><p>${esc(a)}</p></div>`).join('')}</div></section>`
    + `<nav class="meer"><p class="eb">Read next</p><a href="${c.L('how-to-stick-to-new-years-resolutions')}">How to stick to your New Year’s resolutions</a><a href="${c.L('guides')}">All guides</a></nav>`
    + `<style>${CSS}</style><script>${chatJs(api, koop, c.pdf)}</script>`;
  const ld = [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Why didn’t it work this year? A 2-minute check', url: BASE + '/' + SLUG, applicationCategory: 'LifestyleApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: vragen.map(([v, a]) => ({ '@type': 'Question', name: v, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  return schil(c, { slug: SLUG, title: 'Why Didn’t My Resolution Work This Year? Free 2-Minute Check', desc: 'Three questions show what really stopped you this year, the fix that works and one step for today. Compare with everyone else who took the check.', body, ld, noindex: !c.waaromLive });
}

// Telt één afgeronde check (de aanroeper zorgt dat een sessie één keer telt).
export function telVelden({ doel, fase, reden }) {
  return ['n', 'r:' + reden, 'd:' + doel, 'dr:' + doel + ':' + reden, 'f:' + fase, 'fr:' + fase + ':' + reden];
}
export const geldig = o => o && DOELEN.some(x => x[0] === o.doel) && FASEN.some(x => x[0] === o.fase) && REDENEN.some(x => x[0] === o.reden);
export { BEDRAG };
