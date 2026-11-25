// Test: alle vormen en maten van de lerende modal in een echte browser (Henkjan 25 nov 2026: "Test alle soorten vormen en maten van modals ."
// en "Zeer responsive zijn ook ."). Laadt de echte client-JS (MMU_JS en MMM_JS uit fn/mm.js) in een testpagina op gids.kadoly.com (alles
// onderschept, geen netwerk) en beantwoordt de beslis-aanvraag /api/mm/modal met een nagemaakt antwoord per combinatie:
//   elke vorm x elke grootte x tekst kort/lang x stap direct/twee, op 8 schermen (320x568 tot 1920x1080), met de e-mailarm van de spaarkaart
//   (de zwaarste: zegels, punten, voornaam), plus push, gids en chat in elke vorm.
// Per render: geen horizontale scroll, kaart in beeld of zelf scrollbaar, sluitknop zichtbaar en minstens 44x44, op 360x640 (en groter) de
// hoofdknop en het e-mailveld in beeld zonder te scrollen, geen tekst buiten de kaart, invoer minstens 16px, contrast minstens 4,5,
// Esc sluit, en bij hoek, balk, tab en onder blijft de pagina eronder scrollbaar.
// Gebruik: node scripts/test-modal-vormen.mjs [--snel] [--uit=/home/claude/hjdk-api-modaltest]   (Playwright en Chrome nodig, anders overgeslagen)
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { try { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); } catch (e2) { console.log('overgeslagen: geen playwright'); process.exit(0); } }
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const SNEL = process.argv.includes('--snel'), UIT = arg('uit') || '/home/claude/hjdk-api-modaltest';
mkdirSync(UIT, { recursive: true });

// de echte client uit fn/mm.js (String.raw zonder ${}: de tekst tussen de backticks is de code)
const bron = readFileSync(path.join(ROOT, 'fn/mm.js'), 'utf8');
const raw = naam => { const a = bron.indexOf('const ' + naam + ' = String.raw`'); if (a < 0) throw Error(naam + ' niet gevonden'); const b = bron.indexOf('`;', a); return bron.slice(a + ('const ' + naam + ' = String.raw`').length, b); };
const CLIENT = raw('MMU_JS') + '\n' + raw('MMM_JS');
const { MODALS } = await import('../lib/modalmotor.js');
const { VORMEN, FACTOREN } = await import('../lib/modal.js');
const sj = MODALS.kadolygids, arm = id => sj.armen.find(a => a.id === id);
const STIJL = { ...sj.stijl };

const SCHERMEN = [[320, 568], [360, 640], [390, 844], [414, 896], [768, 1024], [1024, 768], [1366, 768], [1920, 1080]];
const GROOTTES = FACTOREN.grootte, TEKST = ['kort', 'lang'], STAP = ['direct', 'twee'];
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

function antwoord(c) { // zoals lib/modal.js openbaar() het teruggeeft
  const a = arm(c.arm), lang = c.tekst === 'lang';
  const o = { id: a.id, soort: a.soort, moment: 'tijd:1', vorm: c.vorm, plek: c.vorm === 'blok' ? 'product' : '', stijl: STIJL, beeld: '', titel: a.titel, tekst: a.tekst, knop: a.knop, nee: a.nee, taal: 'nl',
    fx: { grootte: c.grootte, tekst: c.tekst, ...(a.soort === 'email' ? { stap: c.stap, velden: lang ? '2' : '1', freq: lang ? 'ja' : 'nee' } : {}), ...(a.beeldSoort ? { beeld: lang ? 'ja' : 'geen' } : {}) } };
  if (a.punten) o.punten = a.punten; if (a.beeldSoort) o.beeldSoort = a.beeldSoort;
  if (a.soort === 'email') Object.assign(o, { vraag: a.vraag, freqTekst: a.freqTekst, veld: a.veld, klein: a.klein, dank: a.dank, doel: 'kadoly' });
  if (a.soort === 'push') Object.assign(o, { sw: '/kadoly-sw.js', vapid: 'BAAA', dank: a.dank, klein: a.klein });
  if (a.soort === 'gids') Object.assign(o, { href: 'https://gids.kadoly.com/?mmc=test', gidsen: [{ titel: 'Kerstcadeau kiezen', url: 'https://gids.kadoly.com/kerstcadeau', sub: 'Eerlijke tips per budget, met wat niet past.' }, { titel: 'Cadeau voor haar', url: 'https://gids.kadoly.com/cadeau-voor-haar', sub: 'Van sieraad tot iets voor thuis.' }, { titel: 'Cadeau voor hem', url: 'https://gids.kadoly.com/cadeau-voor-hem', sub: 'Praktisch of juist iets bijzonders.' }] });
  if (a.soort === 'chat') Object.assign(o, { corpus: 'site', veld: a.veld, keuzes: [{ id: 'vq0', label: 'Wat is een goed kerstcadeau onder €30?', vraag: 'Wat is een goed kerstcadeau onder €30?' }] });
  return { toon: true, test: true, mid: '', min: 0, arm: o };
}
const PAGINA = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Test</title>
<style>body{margin:0;font:16px/1.5 system-ui,sans-serif;color:#000;background:#fff}main{max-width:760px;margin:0 auto;padding:16px}p{margin:0 0 16px}</style></head><body><main><h1>Kerstcadeau kiezen</h1>
${'<p>Een eerlijke keuzehulp met tips per budget. Dit is opvultekst zodat de pagina lang genoeg is om te scrollen, net als een echte gidspagina.</p>'.repeat(10)}
<div data-cm-plek="product"></div>${'<p>Meer tekst onder de plek in de pagina, zodat er onder en boven ruimte is.</p>'.repeat(30)}</main>
<script src="https://go.kadoly.com/cm.js" data-site="kadolygids" data-modal="kadolygids"></script></body></html>`;

// alle combinaties
const combis = [];
for (const [w, h] of SCHERMEN) for (const vorm of VORMEN) for (const grootte of GROOTTES) for (const tekst of TEKST) for (const stap of STAP) combis.push({ w, h, vorm, grootte, tekst, stap, arm: 'm-spaar' });
for (const [w, h] of [[320, 568], [360, 640], [1366, 768]]) for (const vorm of VORMEN) for (const id of ['m-push', 'gids', 'chat']) for (const grootte of ['xs', 'm', 'xl']) combis.push({ w, h, vorm, grootte, tekst: 'lang', stap: 'direct', arm: id });
const lijst = SNEL ? combis.filter((c, i) => i % 7 === 0) : combis;

// controle in de pagina; geeft een lijst fouten
async function controleer(page, c) {
  return page.evaluate(async (c) => {
    const F = [], host = document.querySelector('[data-mmm]'); if (!host) return ['modal niet getoond'];
    const r = host.shadowRoot || host, k = r.querySelector('.k'), W = innerWidth, H = innerHeight, cs = el => getComputedStyle(el);
    const zicht = el => { if (!el) return false; const s = cs(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.1 && b.width > 0 && b.height > 0; };
    const inBeeld = (b, m = 1) => b.left >= -m && b.top >= -m && b.right <= W + m && b.bottom <= H + m;
    if (c.vorm === 'blok') { k.scrollIntoView({ block: 'start' }); await new Promise(x => setTimeout(x, 60)); }
    const kb = k.getBoundingClientRect();
    // 1. geen horizontale scroll, kaart niet breder dan het scherm
    if (document.documentElement.scrollWidth > W + 1) F.push('horizontale scroll: pagina ' + document.documentElement.scrollWidth + ' breed op ' + W);
    if (kb.left < -1 || kb.right > W + 1) F.push('kaart buiten het scherm: ' + Math.round(kb.left) + '..' + Math.round(kb.right) + ' op ' + W);
    if (k.scrollWidth > k.clientWidth + 1) F.push('kaart scrolt horizontaal: ' + k.scrollWidth + ' > ' + k.clientWidth);
    // 2. kaart helemaal in beeld of zelf scrollbaar (een blok staat in de pagina: daar alleen de breedte)
    if (c.vorm !== 'blok' && !inBeeld(kb)) F.push('kaart niet in beeld: top ' + Math.round(kb.top) + ', onder ' + Math.round(kb.bottom) + ' op ' + H);
    if (c.vorm !== 'blok' && k.scrollHeight > k.clientHeight + 1 && !/(auto|scroll)/.test(cs(k).overflowY)) F.push('kaart te hoog en niet scrollbaar: ' + k.scrollHeight + ' > ' + k.clientHeight);
    // 3. sluitknop zichtbaar, minstens 44x44
    const x = r.querySelector('.x'), xb = x && x.getBoundingClientRect();
    if (!zicht(x)) F.push('sluitknop niet zichtbaar'); else { if (xb.width < 43.5 || xb.height < 43.5) F.push('sluitknop ' + Math.round(xb.width) + 'x' + Math.round(xb.height)); if (!inBeeld(xb)) F.push('sluitknop buiten beeld'); if (xb.left < kb.left - 1 || xb.right > kb.right + 1 || xb.top < kb.top - 1) F.push('sluitknop buiten de kaart'); }
    // 4. hoofdknop en e-mailveld in beeld zonder scrollen (vanaf 360x640; op 320x568 mag de kaart scrollen)
    const veld = r.querySelector('.f input[type=email]'), knop = r.querySelector('.f .b, .f button.b');
    const zichtbaarInKaart = el => { const b = el.getBoundingClientRect(); return inBeeld(b) && b.top >= kb.top - 1 && b.bottom <= kb.bottom + 1; };
    if (!(c.w === 320)) { if (!knop || !zicht(knop)) F.push('hoofdknop ontbreekt'); else if (!zichtbaarInKaart(knop)) F.push('hoofdknop niet in beeld zonder scrollen (onder ' + Math.round(knop.getBoundingClientRect().bottom) + ', kaart tot ' + Math.round(kb.bottom) + ')');
      if (c.arm === 'm-spaar' && c.stap === 'direct') { if (!veld || !zicht(veld)) F.push('e-mailveld ontbreekt'); else if (!zichtbaarInKaart(veld)) F.push('e-mailveld niet in beeld zonder scrollen'); } }
    if (knop) { const kn = knop.getBoundingClientRect(); if (kn.height < 43.5) F.push('hoofdknop maar ' + Math.round(kn.height) + ' px hoog'); }
    // 5. geen tekst buiten de kaart
    for (const el of r.querySelectorAll('.k p, .k button, .k a, .k li, .k input, .k .zk')) { if (!zicht(el)) continue; const b = el.getBoundingClientRect();
      if (b.left < kb.left - 1 || b.right > kb.right + 1) F.push('valt buiten de kaart: ' + (el.className || el.tagName) + ' "' + String(el.textContent || el.placeholder || '').slice(0, 30) + '"');
      if (el.tagName !== 'INPUT' && el.scrollWidth > el.clientWidth + 2 && cs(el).overflowX === 'visible' && el.clientWidth > 0) F.push('tekst loopt over: ' + (el.className || el.tagName) + ' "' + String(el.textContent).slice(0, 30) + '"'); }
    // 6. invoer minstens 16px (anders zoomt iOS in)
    for (const i of r.querySelectorAll('input')) if (zicht(i) && parseFloat(cs(i).fontSize) < 16) F.push('invoer ' + cs(i).fontSize);
    // 7. contrast (zwart-wit, minstens 4,5)
    const rgb = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const lum = c0 => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c0.r) + 0.7152 * f(c0.g) + 0.0722 * f(c0.b); };
    const achter = el => { for (let e = el; e && e !== r; e = e.parentNode && e.parentNode.host ? null : e.parentNode) { if (e.nodeType !== 1) continue; const b = rgb(cs(e).backgroundColor); if (b && b.a > 0.5) return b; } return { r: 255, g: 255, b: 255, a: 1 }; };
    for (const el of r.querySelectorAll('.k .t, .k .s, .k .kl, .k .n, .k .b, .k .bw, .k li, .k .gl a, .k .cp, .lip, .k .fo')) { if (!zicht(el) || !String(el.textContent).trim()) continue; const v = rgb(cs(el).color), a = achter(el); if (!v) continue; const L1 = lum(v), L2 = lum(a), cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); if (cr < 4.5) F.push('contrast ' + cr.toFixed(1) + ' bij ' + el.className); }
    return F;
  }, c);
}

const browser = await chromium.launch({ executablePath: existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined, args: ['--no-sandbox'] });
const fouten = [], perVorm = {}, platen = []; let klaar = 0;
async function draai(c, ctx) {
  const page = await ctx.newPage(); await page.setViewportSize({ width: c.w, height: c.h });
  await page.route('**/*', route => { const u = new URL(route.request().url());
    if (u.pathname === '/test') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PAGINA });
    if (u.pathname === '/cm.js') return route.fulfill({ status: 200, contentType: 'application/javascript', body: CLIENT });
    if (u.pathname === '/api/mm/modal') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(antwoord(c)) });
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(u.pathname)) return route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
    return route.fulfill({ status: 204, body: '' }); });
  const F = [];
  try {
    await page.goto('https://gids.kadoly.com/test?mmm=' + c.arm + '~v0~' + c.vorm, { waitUntil: 'load' });
    await page.waitForFunction(() => !!document.querySelector('[data-mmm]'), null, { timeout: 4000 });
    await page.waitForTimeout(320); // animatie
    if (c.vorm === 'tab') { // eerst het lipje: in beeld en groot genoeg, dan openklappen
      const lip = await page.evaluate(() => { const r = document.querySelector('[data-mmm]').shadowRoot, l = r.querySelector('.lip'), b = l.getBoundingClientRect(); return { b: { l: b.left, t: b.top, r: b.right, o: b.bottom, w: b.width, h: b.height }, W: innerWidth, H: innerHeight, k: getComputedStyle(r.querySelector('.k')).display }; });
      if (lip.b.h < 43.5) F.push('lipje maar ' + Math.round(lip.b.h) + ' px hoog'); if (lip.b.l < 0 || lip.b.r > lip.W + 1 || lip.b.o > lip.H + 1) F.push('lipje buiten beeld'); if (lip.k !== 'none') F.push('kaart al open voor de tik op het lipje');
      await page.evaluate(() => document.querySelector('[data-mmm]').shadowRoot.querySelector('.lip').click()); await page.waitForTimeout(260); }
    F.push(...await controleer(page, c));
    // pagina eronder scrollbaar bij hoek, balk, tab en onder (wiel boven in beeld, waar geen kaart staat)
    if (/^(hoek|balk|tab|onder)$/.test(c.vorm)) { const y0 = await page.evaluate(() => scrollY); await page.mouse.move(Math.min(40, c.w / 4), 30); await page.mouse.wheel(0, 400); await page.waitForTimeout(150); const y1 = await page.evaluate(() => scrollY); if (!(y1 > y0)) F.push('pagina eronder scrolt niet (' + y0 + ' -> ' + y1 + ')'); }
    // overzichtsplaatje: elke vorm en grootte op 360x640 (lang, direct) en elke vorm op de andere schermen (m, lang, direct)
    if (c.arm === 'm-spaar' && c.tekst === 'lang' && c.stap === 'direct' && ((c.w === 360) || c.grootte === 'm')) { await page.evaluate(() => scrollTo(0, 0)); if (c.vorm === 'blok') await page.evaluate(() => document.querySelector('[data-mmm]').scrollIntoView({ block: 'start' })); await page.waitForTimeout(60); platen.push({ c, png: await page.screenshot({ type: 'png' }) }); }
    // Esc sluit (een blok staat in de pagina en sluit met het kruisje)
    if (c.vorm !== 'blok') { await page.keyboard.press('Escape'); await page.waitForTimeout(80); if (await page.evaluate(() => !!document.querySelector('[data-mmm]'))) F.push('Esc sluit niet'); }
  } catch (e) { F.push('fout: ' + String(e.message || e).split('\n')[0].slice(0, 140)); }
  await page.close();
  const sleutel = c.vorm; perVorm[sleutel] = perVorm[sleutel] || { n: 0, fout: 0 }; perVorm[sleutel].n++;
  if (F.length) { perVorm[sleutel].fout++; fouten.push({ c, F }); }
  klaar++; if (klaar % 100 === 0) process.stdout.write(klaar + '/' + lijst.length + ' ');
}
const PAR = 6, ctxs = await Promise.all(Array.from({ length: PAR }, async () => { const x = await browser.newContext({ deviceScaleFactor: 1 }); await x.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })); return x; })); // cm.js doet niets bij navigator.webdriver (bots); de test is geen bot
let i = 0; await Promise.all(ctxs.map(async ctx => { while (i < lijst.length) { const c = lijst[i++]; await draai(c, ctx); } }));

// contactsheet: een raster van kleine plaatjes met onderschrift
if (platen.length) {
  platen.sort((a, b) => (a.c.w - b.c.w) || VORMEN.indexOf(a.c.vorm) - VORMEN.indexOf(b.c.vorm) || GROOTTES.indexOf(a.c.grootte) - GROOTTES.indexOf(b.c.grootte));
  const cellen = platen.map(p => `<figure><img src="data:image/png;base64,${p.png.toString('base64')}"><figcaption>${p.c.w}x${p.c.h} · ${p.c.vorm} · ${p.c.grootte}</figcaption></figure>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#fff;font:13px system-ui;color:#000}h1{font-size:18px;margin:0 0 10px}.g{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start}figure{margin:0;border:1px solid #000;padding:4px}img{display:block;height:240px;width:auto}figcaption{margin-top:4px}</style></head><body><h1>Lerende modal Kadoly: ${lijst.length} renders, ${fouten.length} met een fout (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)</h1><div class="g">${cellen}</div></body></html>`;
  writeFileSync(path.join(UIT, 'contactsheet.html'), html);
  const p = await (await browser.newContext()).newPage(); await p.setViewportSize({ width: 2400, height: 1000 }); await p.setContent(html, { waitUntil: 'load' });
  await p.screenshot({ path: path.join(UIT, 'contactsheet.png'), fullPage: true }); await p.close();
}
await browser.close();
writeFileSync(path.join(UIT, 'uitslag.json'), JSON.stringify({ at: new Date().toISOString(), renders: lijst.length, fouten: fouten.length, perVorm, eerste: fouten.slice(0, 200) }, null, 1));
console.log('\n' + lijst.length + ' renders; per vorm: ' + Object.entries(perVorm).map(([v, x]) => v + ' ' + x.fout + '/' + x.n + ' fout').join(', '));
if (fouten.length) { const tel = {}; for (const f of fouten) for (const m of f.F) { const k = f.c.vorm + ': ' + m.replace(/[-\d.]+/g, '#'); tel[k] = (tel[k] || 0) + 1; }
  console.log(Object.entries(tel).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, n]) => n + 'x ' + k).join('\n'));
  console.log('voorbeeld: ' + JSON.stringify(fouten[0]));
  console.log(fouten.length + ' FOUT(EN)'); process.exit(1); }
console.log('ALLES GOED · contactsheet: ' + path.join(UIT, 'contactsheet.png'));
