// Wijzigingsherkenning voor de bestaande gids-indexnow-cron; geen extra meetlus.
import { createHash } from 'node:crypto';

const canon = value => Array.isArray(value) ? value.map(canon) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canon(value[k])])) : typeof value === 'function' ? String(value) : value;
const hash = value => createHash('sha256').update(JSON.stringify(canon(value))).digest('hex');
// Alleen gegevens die inhoud, aanbod, prijs, verzending of bezorging bepalen.
// Views en kliktellers mogen geen dagelijkse heraanmelding veroorzaken.
const product = i => Object.fromEntries(['id','t','p','vk','fs','lt','vr','b','c','s','l','img'].map(k => [k, i[k] ?? null]));
const lijst = xs => xs.map(product).sort((a,b) => String(a.id).localeCompare(String(b.id)));

export function gidsIndexPlan({ host, items, gidsen, onderzoek, bronnen, nieuw, rubrieken, vorig, versies }) {
  const actief = items.filter(i => i && i.vr !== false);
  const cat = Object.fromEntries(items.filter(Boolean).map(i => [i.id, i]));
  const paginas = {};
  const zet = (pad, data) => { paginas[host + pad] = hash(data); };
  zet('/', { versie:versies.home, aanbod:lijst(actief), gidsen:gidsen.map(g => ({slug:g.slug,h1:g.h1,beschrijving:g.beschrijving})), checks:versies.checks });
  zet('/alle-producten', { versie:versies.catalogus, aanbod:lijst(actief), onderzoek, bronnen });
  for (const r of rubrieken) zet('/rubriek/' + r.c, { versie:versies.rubrieken, aanbod:lijst(r.items), onderzoek, bronnen });
  if (nieuw.length) zet('/nieuw-bij-kadoly', { versie:versies.nieuw, aanbod:lijst(nieuw), onderzoek, bronnen });
  for (const g of gidsen) zet('/' + g.slug, { versie:versies.gidsen, inhoud:g, aanbod:lijst((g.keuze || []).map(k => cat[k.pid]).filter(Boolean)), onderzoek, bronnen });
  zet('/onderzoek-en-bronnen', { versie:versies.onderzoek, onderzoek, bronnen, dekking:onderzoek.map(p => actief.filter(p.match).length), totaal:actief.length });
  for (const p of onderzoek) zet('/onderzoek-' + p.id, { versie:versies.onderzoek, inhoud:p, bronnen:p.bronnen.map(id => bronnen[id]), aanbod:lijst(actief.filter(p.match)) });
  // Eenmalige migratie: oud gk:indexnow-object behouden en aanvullen met hashes.
  // Ook verwijderde URLs aanmelden zodat zoekmachines de 404 kunnen verwerken.
  const oud = vorig?.paginas || {};
  const gewijzigd = Object.keys(paginas).filter(url => paginas[url] !== oud[url]);
  const verwijderd = Object.keys(oud).filter(url => !paginas[url]);
  return { paginas, urls:[...gewijzigd,...verwijderd], gewijzigd:gewijzigd.length, verwijderd:verwijderd.length };
}
