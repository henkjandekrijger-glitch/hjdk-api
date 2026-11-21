// Compleet bladeroverzicht; geen producttests, geen pagina per productvariant.
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function catalogusItems(items) {
  return [...new Map(items.filter(i => i && i.id && i.t && i.vr !== false).map(i => [String(i.id), i])).values()];
}
export function catalogusInhoud(items, {rubriek, soort, prijs, bezorgdag, koopcheck}) {
  const lijst = catalogusItems(items), groepen = new Map();
  for (const i of lijst) { const c = rubriek(i.c); if (!groepen.has(c.id)) groepen.set(c.id, { ...c, items: [] }); groepen.get(c.id).items.push(i); }
  const rubrieken = [...groepen.values()].sort((a,b) => (a.id === 'overig') - (b.id === 'overig') || b.items.length-a.items.length);
  const nav = `<nav aria-label="Alle rubrieken"><ul class="toc">${rubrieken.map(c=>`<li><a href="#alle-${e(c.id)}">${e(c.naam)} (${c.items.length})</a></li>`).join('')}</ul></nav>`;
  const html = nav + rubrieken.map(c => `<section id="alle-${e(c.id)}"><h2>${e(c.naam)}: ${c.items.length} producten</h2><p><a href="/rubriek/${e(c.id)}">Hulp bij kiezen in ${e(c.naam.toLowerCase())}</a></p><div style="overflow:auto"><table><thead><tr><th scope="col">Product en soort</th><th scope="col">Prijs incl. verzending</th><th scope="col">Verwachte bezorging</th><th scope="col">Bronadvies</th></tr></thead><tbody>${c.items.sort((a,b)=>String(a.t).localeCompare(String(b.t),'nl')).map(i=>`<tr id="product-${e(i.id)}"><th scope="row" style="min-width:15rem"><a href="/naar/${encodeURIComponent(i.id)}?g=catalogus&amp;b=aanbod" rel="nofollow">${e(i.t)}</a><div class="meta">${e([i.b,soort(i.s)].filter(Boolean).join(' · '))}</div></th><td>${e(prijs(i))}</td><td>${e(bezorgdag(i))}</td><td>${koopcheck(i) || '<span class="meta">Nog geen externe koopcheck gekoppeld.</span>'}</td></tr>`).join('')}</tbody></table></div><p><a href="#top">Terug naar alle rubrieken</a></p></section>`).join('');
  return { lijst: rubrieken.flatMap(c => c.items), html };
}

// Alleen duidelijke Droppery-titels corrigeren; de gedeelde winkelbron blijft intact.
export function normaliseerGidsProduct(i) {
 if (!i || !/^dp_\d+$/.test(i.id || '')) return i;
 let s=null;
 if (i.id==='dp_1074') s='muur'; // gecontroleerde rieten wandkunst, geen eetbord
 else if (/lamp|kroonluchter/i.test(i.t || '')) s='verlichting';
 else if (/spiegel|wanddecoratie/i.test(i.t || '')) s='muur';
 else if (/bagagerek|(?:bijzet|console|salon|eet|nacht|cocoon)tafel|mediaconsole|mediameubel|dressoir|ladekast|nachtkast|platformbed|barkruk|barstoel|eetkamerstoel|tuinstoel|bijzetkruk|\bkruk\b|zeegraskruk|tweezitsbank|eetbank|zeegrasbank|\bbank met|poef/i.test(i.t || '')) s='meubels';
 else if (/\bmand(?:en)?\b/i.test(i.t || '')) s='opbergen';
 if (!s || i.c==='wonen' && i.s===s) return i;
 return {...i,c:'wonen',s,bronRubriek:{c:i.c||'',s:i.s||''}};
}
