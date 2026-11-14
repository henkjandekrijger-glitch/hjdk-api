// UX-controle van bedrijfspagina's op curacao.day (Henkjan 14 nov 2026: "doe ook echt UX asessment ... en neem dan mee in dagelijkse update vd bedrijven").
// Gebruik in de nachtronde: haal bedrijfspagina's op met de Vercel-tool web_fetch_vercel_url
// (https://hjdk-api-henq.vercel.app/curacao-gids?m=<taal>&s=businesses&b=<soort>&c=<zaak>), bewaar het veld "text" als .html en draai:
//   node scripts/ux-bedrijf.mjs pagina1.html pagina2.html [--shot map]
// Telefoonscherm 360x640 en 390x844, licht en donker. Elke fout heeft een code; exit 1 bij een fout. --shot bewaart schermafbeeldingen.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('playwright ontbreekt'); process.exit(2); }

const args = process.argv.slice(2), si = args.indexOf('--shot'), shot = si >= 0 ? args.splice(si, 2)[1] : '';
const files = args.filter(f => f.endsWith('.html'));
if (!files.length) { console.error('geef .html-bestanden mee'); process.exit(2); }

const REGELS = {
  pluscode: 'Plus Code (zoals 535V+4RQ) in de tekst: alleen straat en plaats tonen',
  telkaal: 'telefoonnummer onleesbaar (+59997384660): schrijf +599 9 738 4660',
  dubbel: 'blok dubbel op de pagina (zelfde kop of twee keer het aanmeldvak)',
  nul: 'nul of leeg getoond (nog geen reviews, 0 ...): weglaten of positief vragen',
  streep: 'gedachtestreepje (– of —) in de tekst',
  contrast: 'tekst haalt geen contrast 4,5 (WCAG AA) tegen zijn achtergrond',
  vouw: 'de knoppen (bellen, route) staan niet in het eerste scherm van 360x640',
  lang: 'pagina langer dan 2.800 px op 390 breed: te veel elementen',
  hoofd: 'naam of adres in HOOFDLETTERS of helemaal klein in een lijst',
  breed: 'pagina scrollt zijwaarts',
  week: 'zeven regels openingstijden: één regel ("Elke dag 08:00-20:00") met uitklap',
  geenfeit: 'tijden, telefoon en adres ontbreken (in de chat als regels, of zonder JavaScript als feitenblok)',
  tikklein: 'knop of link kleiner dan 40 px hoog in het eerste scherm',
  chat: 'de chat van de site over deze zaak ontbreekt, of er staat nog een los vraagveld naast',
  rust: 'meer dan de vaste typografie: lettermaat buiten 13/16/18/24 (30+ mag voor de titel), meer dan één labelstijl of meer dan één linkstijl (lib/currust.js)',
};

function lum(c) { const m = String(c).match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

const b = await chromium.launch(); const uit = []; let fout = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8'), r = { pagina: path.basename(f), fouten: [] }, voeg = (code, waar) => { if (!r.fouten.some(x => x.code === code && x.waar === waar)) r.fouten.push({ code, wat: REGELS[code], waar: String(waar || '').slice(0, 120) }); };
  for (const [w, h, cs] of [[360, 640, 'light'], [390, 844, 'light'], [390, 844, 'dark']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: cs, deviceScaleFactor: 1 });
    await p.route('**/*', q => q.request().url().startsWith('file:') ? q.continue() : q.abort());
    await p.goto('file://' + path.resolve(f)); await p.waitForTimeout(150);
    const d = await p.evaluate(({ w, h }) => {
      const main = document.querySelector('main') || document.body, zicht = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
      const tekst = main.innerText || '';
      const bg = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; } return getComputedStyle(document.body).backgroundColor || 'rgb(255,255,255)'; };
      const con = []; main.querySelectorAll('h1,h2,h3,p,a,span,small,b,dt,dd,li,summary,button,label').forEach(el => { if (!zicht(el)) return; const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim(); if (t.length < 2) return; const s = getComputedStyle(el); con.push({ t: t.slice(0, 40), c: s.color, b: bg(el), fs: parseFloat(s.fontSize), fw: Number(s.fontWeight) || 400 }); });
      const tik = main.querySelector('.tik'), tb = tik ? tik.getBoundingClientRect() : null;
      const klein = [...main.querySelectorAll('.tik a, .bz-feit a, a.bz-rij')].filter(zicht).filter(a => { const r = a.getBoundingClientRect(); return r.top < h && r.height < 40 && !a.closest('.bz-feit'); }).map(a => a.innerText.trim().slice(0, 30));
      const h2 = [...main.querySelectorAll('h2')].filter(zicht).map(x => x.innerText.trim());
      const caps = [...main.querySelectorAll('a.bz-rij b, a.bz-rij small, .g-rij a, .g-sub')].filter(zicht).map(x => x.innerText.trim()).filter(t => (/[A-Z]{4}/.test(t) && t === t.toUpperCase()) || (/^[a-z]{3}/.test(t) && t === t.toLowerCase()));
      const rijen = [...main.querySelectorAll('section')].filter(zicht).map(s => s.querySelectorAll('.line').length).reduce((a, x) => Math.max(a, x), 0);
      const chat = !!document.querySelector('[data-cw-ama][data-ond]') && !document.querySelector('form.cwq'), feit = !!main.querySelector('.bz-feit, li.ama-feit'), cwa = [...document.querySelectorAll('section.cwa')].filter(zicht).length;
      const rust = { maat: [], lab: new Set(), link: new Set() }; for (const el of document.querySelectorAll('body *')) { if (!zicht(el) || el.closest('.brand,.merk')) continue; const t = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').trim(); if (t.length < 2) continue; const s = getComputedStyle(el), px = parseFloat(s.fontSize); if (px < 30 && ![13, 16, 18, 24].includes(px) && rust.maat.length < 3) rust.maat.push(s.fontSize + ' "' + t.slice(0, 20) + '"'); if ((px === 18 || px === 24) && +s.fontWeight < 600 && rust.maat.length < 3) rust.maat.push(s.fontSize + ' gewone tekst "' + t.slice(0, 20) + '"'); if (s.textTransform === 'uppercase') rust.lab.add(s.fontSize + ' ' + s.fontWeight + ' ' + s.color); if (el.tagName === 'A' && s.textDecorationLine.includes('underline')) rust.link.add(s.fontSize + ' ' + s.fontWeight + ' ' + s.color + ' ' + s.textDecorationColor); }
      return { rust: { maat: rust.maat, lab: [...rust.lab], link: [...rust.link] }, chat, tekst, con, tb: tb ? { bottom: tb.bottom } : null, klein, h2, caps, rijen, feit, cwa, hoogte: document.documentElement.scrollHeight, breed: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2 };
    }, { w, h });
    const tag = w + 'x' + h + (cs === 'dark' ? ' donker' : '');
    if (cs === 'light' && w === 390) {
      if (/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b/.test(d.tekst)) voeg('pluscode', (d.tekst.match(/\S*[23456789CFGHJMPQRVWX]{4,8}\+\S+/) || [''])[0]);
      if (/\+5999\d{7}\b/.test(d.tekst)) voeg('telkaal', (d.tekst.match(/\+5999\d{7}/) || [''])[0]);
      if (d.cwa > 1) voeg('dubbel', d.cwa + ' aanmeldvakken');
      const dub = d.h2.filter((x, i) => x && d.h2.indexOf(x) !== i); if (dub.length) voeg('dubbel', dub[0]);
      const nul = d.tekst.match(/(no reader reviews yet|nog geen review|noch keine leserbewertung|aún no hay opiniones|ainda sem avaliações|\b0 (reviews|lezers|readers|bezoeken|visits)\b)/i); if (nul) voeg('nul', nul[0]);
      if (/[–—]/.test(d.tekst)) voeg('streep', (d.tekst.match(/.{0,30}[–—].{0,30}/) || [''])[0]);
      if (d.hoogte > 2800) voeg('lang', d.hoogte + ' px');
      if (d.caps.length) voeg('hoofd', d.caps[0]);
      if (d.rijen >= 7) voeg('week', d.rijen + ' regels');
      if (!d.feit) voeg('geenfeit', '');
      if (!d.chat) voeg('chat', '');
      if (d.rust.maat.length || d.rust.lab.length > 1 || d.rust.link.length > 1) voeg('rust', [d.rust.maat.join(', '), d.rust.lab.length > 1 ? d.rust.lab.length + ' labelstijlen' : '', d.rust.link.length > 1 ? d.rust.link.length + ' linkstijlen' : ''].filter(Boolean).join('; '));
    }
    if (w === 360) { if (!d.tb || d.tb.bottom > h) voeg('vouw', d.tb ? 'onderkant knoppen op ' + Math.round(d.tb.bottom) + ' px' : 'geen knoppen'); if (d.klein.length) voeg('tikklein', d.klein[0]); }
    if (d.breed) voeg('breed', tag);
    for (const x of d.con) { const a = lum(x.c), c = lum(x.b); if (a == null || c == null) continue; const k = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05), groot = x.fs >= 24 || (x.fs >= 18.66 && x.fw >= 700); if (k < (groot ? 3 : 4.5)) voeg('contrast', tag + ': "' + x.t + '" ' + k.toFixed(2)); }
    if (shot) { fs.mkdirSync(shot, { recursive: true }); await p.screenshot({ path: path.join(shot, path.basename(f, '.html') + '-' + w + (cs === 'dark' ? '-donker' : '') + '.png'), fullPage: true }); }
    await p.close();
  }
  if (r.fouten.length) fout++;
  uit.push(r);
}
await b.close();
console.log(JSON.stringify({ gecontroleerd: files.length, met_fouten: fout, regels: REGELS, uitslag: uit }, null, 1));
process.exit(fout ? 1 : 0);
