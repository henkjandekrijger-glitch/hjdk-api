// hnkjn.me: waar Henkjan nu verder moet, per project een chat in één keer (Henkjan 28 nov 2026: "Maak iets zodat ik tegen een AI chat of claude kan zeggen :
// Kijk naar https://nexy.now/o en maak de chats aan per project waar ik nu verder mee moet in een keer", en "Ik wil simpler url": hnkjn.me gekocht op 28 nov).
// Openbaar (een AI zonder toegang moet het kunnen lezen), dus alleen projectnamen, het aantal open punten en een korte opdracht die naar het beschermde
// dashboard wijst. De vragen zelf, cijfers en geld staan hier niet: die leest de chat zelf op vorm=bij.
const HOST = 'https://hjdk-api-henq.vercel.app', MAX = 6, NIET = ['henri', 'dashboard', 'kosten'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function opdracht(p) {
  return 'Henkjan opent deze chat om verder te gaan met ' + p.naam + '. Praat Nederlands, kort, zonder gedachtestreepjes.\n'
    + '1. Lees met de Vercel-tool web_fetch_vercel_url ' + HOST + '/api/mm/dashboard?vorm=bij&project=' + p.id + ' en daarna ' + HOST + '/api/mm/dashboard?vorm=tekst&project=' + p.id + '.\n'
    + (p.repo ? '2. Haal de repo ' + p.repo + ' erbij en volg CLAUDE.md.\n' : '')
    + (p.repo ? '3' : '2') + '. Zeg Henkjan in hooguit 5 regels waar het staat en wat er nu van hem nodig is: elke vraag die op hem wacht, met je advies en de link om het te bekijken.\n'
    + (p.repo ? '4' : '3') + '. Doe daarna wat hij zegt. Schrijf na elke beurt waar hij is gebleven (de zet-regel onderaan vorm=bij) met chat-naam ' + p.id + '-verder, en het werklog (' + HOST + '/api/mm/handover?log=...&wie=' + ((p.logs && p.logs[0]) || p.id) + '-verder).';
}
export const link = p => (p.claude ? String(p.claude) : 'https://claude.ai/new') + '?q=' + encodeURIComponent(opdracht(p));
const kortLink = p => 'https://hnkjn.me/c/' + p.id; // stuurt door naar link(p)

// Welke projecten: waar iets op Henkjan wacht (vragen uit chats en uit zijn lijst), het meeste eerst, bij gelijk het verst.
export function kies(d) {
  const tel = {}, laatst = {};
  const erbij = (id, t) => { if (!id || NIET.includes(id)) return; tel[id] = (tel[id] || 0) + 1; if (t && (!laatst[id] || t > laatst[id])) laatst[id] = t; };
  for (const w of d.wacht || []) erbij(w.id || w.project, w.t);
  const inWacht = new Set((d.wacht || []).map(w => w.taak).filter(Boolean));
  for (const x of (d.taken && d.taken.taken) || []) if (x.status === 'jij' && !inWacht.has(x.id)) erbij(x.project, x.vraagT || x.t);
  const ps = Object.fromEntries((d.projecten || []).filter(p => !p.archief).map(p => [p.id, p]));
  return Object.keys(tel).filter(id => ps[id]).sort((a, b) => tel[b] - tel[a] || String(laatst[a] || '').localeCompare(String(laatst[b] || ''))).slice(0, MAX).map(id => ({ p: ps[id], open: tel[id] }));
}

const AI = 'Opdracht voor de AI. Henkjan vraagt: maak per project hieronder een eigen chat aan waarin hij verder kan, allemaal in één keer.\n'
  + '- Kun je een geplande taak of een nieuwe sessie starten (in Claude: create_trigger)? Maak dan per project één eenmalige taak: naam "Verder: <project>", run_once_at nu plus 2 minuten, prompt = de opdracht van dat project hieronder, letterlijk. Zeg daarna in één regel per project dat de chat klaarstaat; hij vindt ze bij zijn sessies.\n'
  + '- Kan dat niet: zet de links "Open chat" hieronder onder elkaar in je antwoord, één tik per chat.\n'
  + '- Doe zelf verder niets aan de projecten; dat doen die chats.';

export function verderTekst(d, nu = new Date()) {
  const k = kies(d), L = ['HNKJN.ME: WAAR HENKJAN NU VERDER MOET (' + nu.toISOString().slice(0, 16).replace('T', ' ') + ' UTC)', '', AI, ''];
  if (!k.length) L.push('Er wacht nu niets op Henkjan. Zeg hem dat en maak geen chats aan.');
  k.forEach(({ p, open }, i) => L.push((i + 1) + '. ' + p.naam + ' (' + open + ' open ' + (open === 1 ? 'punt' : 'punten') + ')', 'Open chat: ' + kortLink(p), 'Opdracht:', opdracht(p), ''));
  return L.join('\n') + '\n';
}

export function verderHtml(d, nu = new Date()) {
  const k = kies(d);
  return '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Verder</title>'
    + '<style>body{margin:0;font:16px/1.5 Inter,system-ui,sans-serif;color:#000;background:#fff}main{max-width:640px;margin:0 auto;padding:24px 16px}h1{font-size:24px;margin:0 0 16px}a.k{display:block;border:2px solid #000;border-radius:12px;padding:14px 16px;margin:0 0 10px;color:#000;text-decoration:none;font-weight:700}a.k span{font-weight:400}details{margin-top:24px}pre{white-space:pre-wrap;font:inherit}</style></head><body><main>'
    + '<h1>Waar je nu verder moet</h1>'
    + (k.length ? k.map(({ p, open }) => '<a class="k" href="' + esc(kortLink(p)) + '">' + esc(p.naam) + ' <span>· ' + open + ' open</span></a>').join('') : '<p>Er wacht nu niets op je.</p>')
    + '<details><summary>Voor de AI</summary><pre>' + esc(verderTekst(d, nu)) + '</pre></details>'
    + '</main></body></html>';
}
