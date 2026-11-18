// Keuring van de huisstijl (18 nov 2026). Henkjan: "ALLE bestaande keuzehulpen ALLEMAAL echt consistent . Kun je dat garanderen ? zo ja regel het dan."
// Elke ochtend (cron /api/kz/keuring) haalt deze ronde van elk soort keuzehulppagina een paar live adressen op en controleert de vaste regels.
// Uitkomst in kv kz:keuring (laatste) en in de overdracht (/api/kz?op=overdracht). Lees ook: /api/kz?op=keuring&lees=1.
// Regels per pagina: huisstijl geladen (data-huisstijl), kop .topbar, voet in één regel (footer.voet1, maar één footer), geen Clickmind-modal
// (cm.js met data-modal="geen"), geen blauw icoon, geen tweede stylesheet ná de huisstijl, geen inline blauwe knop (background:#2B47C4).
// Wat de HTML-keuring niet ziet (kleur bij muis erop, contrast van tekst die JavaScript erbij zet) controleert scripts/keur-huisstijl.mjs met Playwright.
import { kv } from './db.js';

export const SOORTEN = [
  ['NL voorpagina', 'https://keuzehulp.best/'],
  ['NL categorie', 'https://keuzehulp.best/categorie/koken'],
  ['NL keuzehulp', 'https://keuzehulp.best/bluetooth-speaker'],
  ['NL kerstcadeau', 'https://keuzehulp.best/kerstcadeau'],
  ['NL deals', 'https://keuzehulp.best/deals'],
  ['NL over ons', 'https://keuzehulp.best/keuzehulp/over'],
  ['NL zorgverzekering', 'https://keuzehulp.best/zorgverzekering'],
  ['NL zorg subpagina', 'https://keuzehulp.best/zorgverzekering/tandartsverzekering'],
  ['NL Rotterdam', 'https://keuzehulp.best/rotterdam'],
  ['NL verzekeringen', 'https://keuzehulp.best/verzekeringen'],
  ['NL rekenhulp laadpaal', 'https://keuzehulp.best/laadpaal'],
  ['NL rekenhulp domeinnaam', 'https://keuzehulp.best/domeinnaam-kiezen'],
  ['NL energie', 'https://keuzehulp.best/energieleverancier-vergelijken'],
  ['NL temu', 'https://keuzehulp.best/temu-alternatieven'],
  ['NL stekkerbatterij', 'https://keuzehulp.best/stekkerbatterij'],
  ['US home', 'https://whichtobuy.best/'],
  ['US category', 'https://whichtobuy.best/category/home-kitchen'],
  ['US guide', 'https://whichtobuy.best/glass-air-fryer'],
  ['US about', 'https://whichtobuy.best/about'],
  ['US tool domain', 'https://whichtobuy.best/domain-name'],
  ['DE Startseite', 'https://kaufberater.best/'],
  ['DE Kaufberater', 'https://kaufberater.best/kaffeevollautomat-unter-500-euro-milchschaum-2026'],
  ['DE Impressum', 'https://kaufberater.best/about'],
  ['nexy.help', 'https://nexy.help/'],
  ['nexy.help vergelijk', 'https://nexy.help/compare']
];

export function keurHtml(h) {
  const f = [];
  if (!/data-huisstijl="1"/.test(h)) f.push('huisstijl ontbreekt');
  else if (/data-huisstijl="1"[\s\S]*<style(?![^>]*data-huisstijl)/.test(h.replace(/<script[\s\S]*?<\/script>/g, ''))) f.push('stylesheet na de huisstijl');
  if (!/<header class="topbar"/.test(h)) f.push('kop niet standaard');
  const voeten = (h.match(/<footer\b/g) || []).length;
  if (!/<footer class="voet1"/.test(h)) f.push('voet niet in één regel'); else if (voeten > 1) f.push(voeten + ' voeten');
  if (/<script[^>]*src="\/cm\.js"(?![^>]*data-modal="geen")/.test(h)) f.push('Clickmind-modal staat aan');
  if (/fill%3D%27%232B47C4/.test(h)) f.push('blauw icoon');
  if (/background(-color)?:\s*#2B47C4/i.test(h)) f.push('inline blauw vlak');
  return f;
}

export async function keuring(soorten) {
  const lijst = soorten || SOORTEN, uit = [];
  await Promise.all(lijst.map(async ([naam, url]) => {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (keuring huisstijl keuzehulp)', accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
      if (!r.ok) { uit.push({ naam, url, status: r.status, fouten: ['HTTP ' + r.status] }); return; }
      const h = await r.text(); uit.push({ naam, url, status: r.status, fouten: keurHtml(h) });
    } catch (e) { uit.push({ naam, url, status: 0, fouten: ['niet bereikbaar: ' + String(e && e.message || e).slice(0, 60)] }); }
  }));
  uit.sort((a, b) => lijst.findIndex(x => x[0] === a.naam) - lijst.findIndex(x => x[0] === b.naam));
  const fout = uit.filter(x => x.fouten.length);
  const stand = { at: new Date().toISOString(), paginas: uit.length, goed: uit.length - fout.length, fout: fout.length, uit };
  try { await kv.set('kz:keuring', stand, { ex: 30 * 86400 }); } catch (e) {}
  return stand;
}

export async function laatsteKeuring() { try { return await kv.get('kz:keuring'); } catch (e) { return null; } }

export function keuringTekst(s) {
  if (!s) return ['- Nog geen keuring gedraaid (cron /api/kz/keuring, elke ochtend 06:45 UTC).'];
  const r = ['- Laatste keuring ' + s.at.slice(0, 16).replace('T', ' ') + ' UTC: ' + s.goed + ' van ' + s.paginas + ' soorten pagina\'s volgens de huisstijl.'];
  for (const x of s.uit.filter(x => x.fouten.length)) r.push('  - ' + x.naam + ' (' + x.url + '): ' + x.fouten.join(', '));
  return r;
}
