// Controle op de volgorde en de chatvragen van alle Curaçao-gidsen (17 nov 2026, Henkjan bij de vluchtengids: "dit slaat nl nergens op", en bij de
// fastfoodgids: "dit kan natuurlijk niet"). Draai: node scripts/test-cur-rang.mjs
// 1. Volgorde, voor elke gids en elke combinatie van antwoorden: wat past staat boven wat niet past; bij gelijke punten staat de hogere
//    reviewscore boven; in de top 3 staat geen zaak onder de 3,5 boven een zaak die past, dezelfde of meer punten heeft en hoger scoort.
// 2. Chat: geen voorbeeldvraag waarvan het antwoord zegt dat we het niet weten, in 5 talen.
import assert from 'node:assert/strict';
import * as C from '../lib/cur.js';
import { geenAntw } from '../lib/curux.js';
let routes = 0, fout = 0;
const meld = (...a) => { fout++; console.log('FOUT', ...a); };
for (const o of C.ONDERWERPEN) {
  const D = o.data; if (!D || !(D.items || []).length) continue;
  const vr = D.vragen || [], gw = D.reviewGewicht == null ? 1 : D.reviewGewicht;
  let combos = [[]]; for (const q of vr) { const n = (q.opties || []).length || 1; combos = combos.flatMap(c => Array.from({ length: n }, (_, i) => [...c, i])); if (combos.length > 3000) break; }
  for (const route of combos.slice(0, 3000)) {
    routes++; const R = C.curRang(D.items, vr, route, gw);
    for (let i = 1; i < R.length; i++) {
      const a = R[i - 1], b = R[i], ga = a.r ? a.r.gewogen : 3.5, gb = b.r ? b.r.gewogen : 3.5;
      if (!a.past && b.past) meld(o.id, route.join(''), 'past niet boven past wel:', a.v.naam, '>', b.v.naam);
      if (a.past === b.past && a.s === b.s && ga < gb - 1e-9) meld(o.id, route.join(''), 'gelijke punten, lagere score boven:', a.v.naam, ga.toFixed(2), '>', b.v.naam, gb.toFixed(2));
    }
    R.slice(0, 3).forEach((a, i) => { if (!(a.r && a.r.gemiddeld < 3.5)) return; const beter = R.slice(i + 1).find(b => b.past && b.s >= a.s && b.r && b.r.gewogen > a.r.gewogen); if (beter) meld(o.id, route.join(''), 'lage score in de top 3 boven een betere:', a.v.naam, a.r.gemiddeld, '>', beter.v.naam, beter.r.gemiddeld); });
  }
  if (o.id === 'excursies' || o.id === 'autohuur') continue;
  for (const m of ['nl', 'en', 'de', 'es', 'pt']) {
    let h = ''; try { h = C.renderOnderwerp(m, o, [], D, null, null, null); } catch (e) { meld(o.id, m, 'render', e.message); continue; }
    const mm = h.match(/data-vb="([^"]*)"/); if (!mm) continue;
    const vb = JSON.parse(mm[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    for (const x of vb) if (x.q && geenAntw(x.a)) meld(o.id, m, 'chatvraag zonder antwoord:', x.v);
  }
}
console.log(routes + ' routes over ' + C.ONDERWERPEN.length + ' gidsen, ' + fout + ' fouten');
assert.equal(fout, 0);
