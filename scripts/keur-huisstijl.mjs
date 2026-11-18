// Keuring met een echte browser (Playwright) van de huisstijl van alle keuzehulpen (lib/huisstijl.js, 18 nov 2026).
// Zoekt wat de HTML-keuring (lib/keuring.js) niet ziet: kleur (alles wat niet zwart, grijs of wit is), onleesbare tekst (tekstkleur gelijk aan de
// achtergrond), ook bij muis erop op knoppen, pills en kaarten.
// Gebruik: node scripts/keur-huisstijl.mjs                 (alle soorten pagina's live, uit lib/keuring.js SOORTEN)
//          node scripts/keur-huisstijl.mjs pagina.html ...  (opgeslagen pagina's, bijv. uit web_fetch_vercel_url in een cloudsessie)
// Slaagt (exit 0) alleen als elke pagina schoon is.
import { createRequire } from 'node:module';
import { keurHtml, SOORTEN } from '../lib/keuring.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const doelen = process.argv.slice(2).length ? process.argv.slice(2).map(f => [f, 'file://' + resolve(f)]) : SOORTEN;
const { chromium } = await import('playwright').catch(() => createRequire(import.meta.url)('playwright')); // in de cloudsessie staat Playwright globaal
const b = await chromium.launch(); let fout = 0;
for (const [naam, url] of doelen) {
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  if (url.startsWith('file:')) await p.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
  const uit = [];
  try {
    await p.goto(url, { waitUntil: 'load', timeout: 30000 });
    uit.push(...keurHtml(url.startsWith('file:') ? readFileSync(url.slice(7), 'utf8') : await p.content()));
    const vind = tag => p.evaluate(tag => {
      const out = [], kl = c => { const m = String(c).match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/); if (!m || m[4] === '0') return false; const [r, g, b] = m.slice(1, 4).map(Number); return Math.max(r, g, b) - Math.min(r, g, b) > 45; };
      const bg = el => { while (el) { const c = getComputedStyle(el).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; el = el.parentElement; } return 'rgb(255, 255, 255)'; };
      for (const el of document.querySelectorAll('header *, main *, footer *')) {
        const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || !el.offsetWidth || el.closest('img,picture,svg,video,iframe')) continue;
        const tekst = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()), w = (el.className && String(el.className).slice(0, 30)) || el.tagName;
        if (tekst && kl(s.color)) out.push(tag + ' kleur tekst ' + s.color + ': ' + w + ' "' + el.textContent.trim().slice(0, 30) + '"');
        if (kl(s.backgroundColor) && !(el.offsetWidth <= 12 && el.offsetHeight <= 12)) out.push( // stipjes voor open/dicht mogen kleur houden
tag + ' kleur vlak ' + s.backgroundColor + ': ' + w);
        if (kl(s.borderTopColor) && parseFloat(s.borderTopWidth) > 0) out.push(tag + ' kleur rand: ' + w);
        if (tekst && s.color === bg(el)) out.push(tag + ' ONLEESBAAR: ' + w + ' "' + el.textContent.trim().slice(0, 30) + '"');
      }
      return out;
    }, tag);
    uit.push(...await vind('rust'));
    for (const sel of ['.opt', '.opt.on', '.kx-ps button', '.kx-vb', 'a.card.ov-k', 'a.card.ov-r', 'a.card.ov-c', '.btn', '#choice-updates button', 'header .topnav a', 'footer.voet1 a']) {
      const h = await p.$(sel); if (!h) continue; try { await h.hover({ timeout: 1000 }); uit.push(...await vind('muis op ' + sel)); } catch (e) {}
    }
  } catch (e) { uit.push('niet te laden: ' + String(e.message || e).slice(0, 80)); }
  const u = [...new Set(uit)]; if (u.length) fout++;
  console.log((u.length ? 'FOUT ' : 'goed ') + naam + (u.length ? '\n  ' + u.slice(0, 15).join('\n  ') : ''));
  await p.close();
}
await b.close();
console.log(fout ? fout + ' van ' + doelen.length + ' pagina\'s met fouten' : 'alle ' + doelen.length + ' pagina\'s volgens de huisstijl');
process.exit(fout ? 1 : 0);
