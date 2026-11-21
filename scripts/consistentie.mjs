// Consistentiecheck van de gidspagina's op curacao.day (Henkjan 20 nov 2026: "Nog steeds oude look zorg dat die echt overal weggaat . En doe je
// consistentie check iedere nacht ."). De look van de site (zoals curacao.day/<taal>/agenda) is de maat: wit, rijen met dunne lijnen, kopjes als
// label, de chat van de site (.rz-ama), één gevulde knop (vlagblauw), geen zandvlakken, geen gekleurde zijranden, geen tegels, geen nullen.
// Rendert elke gids (hub en alle onderwerpen, nl en en) lokaal met lib/cur.js, haalt de kop van de site via bzz-henq.vercel.app en meet met
// Playwright de echte stijl. Gebruik: node scripts/consistentie.mjs [talen=nl,en] [max]. Exit 1 bij fouten; uitkomst ook in consistentie.md.
// De nachtronde draait dit, repareert in lib/cur.js (blok RUSTIG in KLEUR) en draait opnieuw tot het slaagt.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright'));
const of = globalThis.fetch; globalThis.fetch = (u, o) => of(String(u).replace('https://bzz.today/', 'https://bzz-henq.vercel.app/'), o);
const CUR = await import('../lib/cur.js');
const TALEN = (process.argv[2] || 'nl,en').split(','), MAX = Number(process.argv[3]) || 200;

async function render(m, s) {
  const hdr = {}; let code = 0, body = '';
  const res = { setHeader: (k, v) => { hdr[k.toLowerCase()] = v; return res; }, getHeader: k => hdr[k.toLowerCase()], status: c => { code = c; return res; }, send: b => { body = b; return res; }, json: j => { body = JSON.stringify(j); return res; }, end: () => res, redirect: () => res };
  const url = new URL('https://hjdk-api-henq.vercel.app/curacao-gids?m=' + m + '&s=' + encodeURIComponent(s));
  const req = { method: 'GET', headers: { host: 'curacao.day', 'user-agent': 'Mozilla/5.0' }, url: url.pathname + url.search, query: Object.fromEntries(url.searchParams) };
  await Promise.race([CUR.curHandler(req, res, url), new Promise(r => setTimeout(r, 20000))]);
  return { code, body: String(body) };
}

const pag = [];
for (const m of TALEN) {
  pag.push({ m, s: '', naam: m + ' hub' });
  for (const o of CUR.ONDERWERPEN) if (CUR.actiefIn(o, m) && o.slug && o.slug[m]) pag.push({ m, s: o.slug[m], naam: m + ' ' + o.id });
}

// in de pagina: elke regel geeft een lijst fouten
const METEN = () => {
  const f = [], zicht = e => { const r = e.getBoundingClientRect(), c = getComputedStyle(e); return r.width > 4 && r.height > 4 && c.visibility !== 'hidden' && c.display !== 'none' && +c.opacity > 0.1; };
  const rgb = s => (s.match(/\d+(\.\d+)?/g) || []).map(Number), naam = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 60);
  const main = document.querySelector('main') || document.body;
  const ZACHT = [238, 241, 252], VLAG = [0, 43, 127], wit = c => c[0] > 245 && c[1] > 245 && c[2] > 245, gelijk = (a, b) => a.length >= 3 && Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 12;
  const MAG_VLAK = el => el.closest('section.cwa,#aanmeld,.rz-ama,.ama,form.cwq,.dl-p,.mmm,[role=dialog]');
  for (const e of main.querySelectorAll('*')) {
    if (!zicht(e)) continue; const c = getComputedStyle(e), bg = rgb(c.backgroundColor), heeftBg = bg.length >= 3 && (bg.length < 4 || bg[3] > 0.05);
    // 1 zandvlak of crème
    if (heeftBg && bg[0] > 245 && bg[1] > 236 && bg[1] < 250 && bg[2] < 238) f.push(['zandvlak', naam(e)]);
    // 2 gekleurde zijrand (oude tegels en labels)
    if (parseFloat(c.borderLeftWidth) >= 3 && c.borderLeftStyle !== 'none') { const b = rgb(c.borderLeftColor); if (b.length >= 3 && !wit(b) && (b.length < 4 || b[3] > 0.1)) f.push(['zijrand', naam(e)]); }
    // 3 dikke gekleurde bovenrand (oude kaarten en secties)
    if (parseFloat(c.borderTopWidth) >= 3 && c.borderTopStyle !== 'none' && e.tagName !== 'HR' && !e.closest('.rz-tabs,header,nav')) f.push(['dikke-bovenrand', naam(e)]);
    // 4 gekleurd vlak met ronde hoeken buiten aanmeldvak en chat (oude tegels)
    if (heeftBg && !wit(bg) && parseFloat(c.borderTopLeftRadius) >= 10 && !MAG_VLAK(e) && !/^(BUTTON|INPUT|IMG|PICTURE|SVG)$/.test(e.tagName) && e.getBoundingClientRect().height > 50) f.push(['tegel', naam(e)]);
    // 5 gevulde knop in een andere kleur dan vlagblauw (WhatsApp en Telegram mogen hun eigen kleur)
    if ((e.tagName === 'BUTTON' || (e.tagName === 'A' && parseFloat(c.paddingLeft) >= 10)) && heeftBg && !wit(bg) && !gelijk(bg, VLAG) && !gelijk(bg, ZACHT) && !/wa\.me|t\.me|whatsapp|telegram/i.test((e.getAttribute('href') || '') + e.className) && !e.closest('.rz-ama,header')) f.push(['gevulde-knop', naam(e) + ' ' + c.backgroundColor]);
  }
  // 5b de regel boven de titel (A Curaçao day · peildatum) blijft gewone tekst, geen hoofdletters (21 nov 2026)
  { let k = document.querySelector('main h1'); while (k && (k = k.previousElementSibling) && !(k.classList && k.classList.contains('eyebrow'))); if (k && getComputedStyle(k).textTransform === 'uppercase') f.push(['kicker-hoofdletters', naam(k)]); }
  // 6 chat zonder de look van de site
  for (const e of document.querySelectorAll('[data-cw-ama]')) if (!e.closest('.rz-ama')) f.push(['chat-oud', naam(e)]);
  // 7 aanmeldvak twee keer zichtbaar
  const cwa = [...document.querySelectorAll('section.cwa')].filter(zicht); if (cwa.length > 1) f.push(['aanmeldvak-dubbel', cwa.length + 'x']);
  // 8 nullen en lege beloftes in de tekst
  const t = main.innerText;
  for (const [k, re] of [['nul-prijs', /(^|\s)[$€]0(\s|$)/m], ['nog-geen', /\b(nog geen|no reviews found|noch keine|aún sin|ainda sem)\b/i]]) if (re.test(t)) f.push([k, (t.match(re) || [''])[0].trim()]);
  return f;
};

const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 390, height: 844 } });
let html = '';
await p.route('**/*', r => { const u = r.request().url(); if (u === 'https://curacao.day/__c') return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
  if (/^https:\/\/(curacao\.day|bzz\.today)\//.test(u)) return r.continue({ url: u.replace(/^https:\/\/(curacao\.day|bzz\.today)\//, 'https://bzz-henq.vercel.app/') }).catch(() => {});
  if (/bzz-henq|fonts\.g/.test(u)) return r.continue().catch(() => {}); return r.abort().catch(() => {}); });
const uit = [];
for (const x of pag.slice(0, MAX)) {
  const r = await render(x.m, x.s).catch(e => ({ code: 0, body: '', fout: e.message }));
  if (r.code !== 200) { uit.push({ ...x, fouten: [['status', String(r.code) + (r.fout ? ' ' + r.fout : '')]] }); continue; }
  html = r.body; await p.goto('https://curacao.day/__c', { waitUntil: 'load', timeout: 30000 }).catch(() => {}); await p.waitForTimeout(1200);
  const f = await p.evaluate(METEN).catch(e => [['meetfout', e.message]]);
  const per = {}; for (const [k, w] of f) (per[k] ||= []).push(w);
  uit.push({ ...x, fouten: Object.entries(per).map(([k, l]) => [k, l.length + 'x: ' + [...new Set(l)].slice(0, 3).join(', ')]) });
}
await b.close();
const fout = uit.filter(x => x.fouten.length);
const md = `# Consistentie gidspagina's ${new Date().toISOString().slice(0, 16)}\n\n${pag.length} pagina's, ${fout.length} met afwijkingen.\n\n` + fout.map(x => `- ${x.naam}: ${x.fouten.map(([k, w]) => `${k} (${w})`).join('; ')}`).join('\n') + '\n';
fs.writeFileSync(new URL('../consistentie.md', import.meta.url), md);
console.log(md);
process.exit(fout.length ? 1 : 0);
