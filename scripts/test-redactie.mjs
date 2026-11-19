// Controle van de redactie (lib/kadoly-redactie.js): draai na elk nieuw artikel; moet slagen voor je pusht.
import { ARTIKELEN, STATUS } from '../lib/kadoly-redactie.js';
const fout = [];
const slugs = new Set();
const woorden = s => String(s).replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').split(/\s+/).filter(Boolean).length;
for (const a of ARTIKELEN) {
  const w = (m) => fout.push(a.slug + ': ' + m);
  if (!/^[a-z0-9-]{8,120}$/.test(a.slug)) w('slug ongeldig');
  if (slugs.has(a.slug)) w('slug dubbel'); slugs.add(a.slug);
  for (const k of ['datum', 'bijgewerkt', 'titel', 'h1', 'besch', 'kort']) if (!a[k]) w('mist ' + k);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.datum)) w('datum');
  if ((a.titel + ' | Kadoly').length > 90) w('titel te lang (' + a.titel.length + ')');
  if (a.besch.length < 110 || a.besch.length > 200) w('besch ' + a.besch.length + ' tekens (110-200)');
  if (woorden(a.kort) > 75) w('kort antwoord ' + woorden(a.kort) + ' woorden (max 75)');
  if (!a.zoektermen || !a.zoektermen.length) w('geen zoektermen');
  else if (!a.titel.toLowerCase().startsWith(a.zoektermen[0].split(' ')[0])) w('zoekterm niet voorop in de titel');
  if (!a.llmgat || !a.llmgat.vraag || !a.llmgat.level) w('geen llmgat (vraag en level)');
  if (!a.faq || a.faq.length < 4) w('minder dan 4 vragen');
  const ids = new Set((a.links || []).map(l => String(l.id)));
  for (const l of a.links || []) if (!/^https:\/\//.test(l.url) || !l.bron || !l.titel) w('link ' + l.id + ' onvolledig');
  const tekst = JSON.stringify([a.kort, a.blokken, a.faq, a.titel, a.h1, a.besch]);
  for (const m of tekst.matchAll(/\]\(#(\d+)\)/g)) if (!ids.has(m[1])) w('verwijzing naar link ' + m[1] + ' bestaat niet');
  const gebruikt = new Set([...tekst.matchAll(/\]\(#(\d+)\)/g)].map(m => m[1]));
  for (const id of ids) if (!gebruikt.has(id) && !(a.blokken.some(b => b.status) && id === '10')) w('link ' + id + ' staat nergens in de tekst');
  if (/[—–]/.test(tekst)) w('gedachtestreepje gevonden');
  if (/\b(nog geen|we konden niet vinden)\b/i.test(tekst)) w('zin over wat we niet vonden');
  if (!a.blokken.some(b => b.h2)) w('geen tussenkoppen');
}
if (!STATUS.bijgewerkt || !STATUS.regels.length) fout.push('STATUS leeg');
if (fout.length) { console.error('MISLUKT\n- ' + fout.join('\n- ')); process.exit(1); }
console.log('OK: ' + ARTIKELEN.length + ' artikel(en)');
