// Bedrijfspagina's van curacao.day: strak en lerend op interactie (Henkjan 14 nov 2026, bij /en/businesses/grocery-store/waterloo-minimarket:
// "Deze paginas moeten echt veel veel strakker ... doe ook echt UX asessment" en "Maak de pagina helemaal lerend op interactiviteit .").
// - Opmaak: één kaart bovenaan (open nu, score, korte plek, knoppen), dan één feitenblok (tijden op één regel, telefoon leesbaar, adres zonder
//   Plus Code), dan sterren, vraag en ochtendmail, dan zaken dichtbij met afstand. Geen nullen, geen dubbele blokken.
// - Leren: Clickmind-proef 'curbedrijf' (lib/proef.js): elke bezoeker krijgt per onderdeel een versie (Thompson sampling, 10 tot 30% verkennen),
//   de waarde per bezoeker is zijn sterkste tik (bellen, WhatsApp, route, website, vraag, sterren, ander bedrijf). Stand:
//   /api/mm/proefstand?site=curbedrijf&vorm=tekst. Daarnaast per blok hoe vaak erin getikt wordt (cur:t:<dag>:bz-<blok>, ?op=uxstand).
// - De nachtronde (CLAUDE.md, sectie bedrijfspagina's) draait scripts/ux-bedrijf.mjs, repareert wat faalt, maakt een winnaar standaard en zet
//   de volgende uitdager uit data/cur/ux-uitdagers.json erbij.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const UXT = {
  nl: { uren: 'Open', alle: 'Elke dag', tel: 'Telefoon', adres: 'Adres', site: 'Website', prijs: 'Prijs', dichtbij: c => c + ' in de buurt', best: c => 'Best beoordeeld: ' + c.toLowerCase(), alle2: (c, n) => 'Alle ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 review op Google' : n + ' reviews op Google', vanaf: 'van hier' },
  en: { uren: 'Hours', alle: 'Every day', tel: 'Phone', adres: 'Address', site: 'Website', prijs: 'Price', dichtbij: c => c + ' nearby', best: c => 'Top rated ' + c.toLowerCase(), alle2: (c, n) => 'All ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 Google review' : n + ' Google reviews', vanaf: 'away' },
  de: { uren: 'Geöffnet', alle: 'Täglich', tel: 'Telefon', adres: 'Adresse', site: 'Website', prijs: 'Preis', dichtbij: c => c + ' in der Nähe', best: c => 'Am besten bewertet: ' + c, alle2: (c, n) => 'Alle ' + n + ' ' + c + ' →', google: n => n === 1 ? '1 Google-Bewertung' : n + ' Google-Bewertungen', vanaf: 'entfernt' },
  es: { uren: 'Horario', alle: 'Todos los días', tel: 'Teléfono', adres: 'Dirección', site: 'Sitio web', prijs: 'Precio', dichtbij: c => c + ' cerca', best: c => 'Mejor valorados: ' + c.toLowerCase(), alle2: (c, n) => 'Los ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 reseña en Google' : n + ' reseñas en Google', vanaf: 'de aquí' },
  pt: { uren: 'Horário', alle: 'Todos os dias', tel: 'Telefone', adres: 'Endereço', site: 'Site', prijs: 'Preço', dichtbij: c => c + ' por perto', best: c => 'Mais bem avaliados: ' + c.toLowerCase(), alle2: (c, n) => 'Todos os ' + n + ' ' + c.toLowerCase() + ' →', google: n => n === 1 ? '1 avaliação no Google' : n + ' avaliações no Google', vanaf: 'daqui' },
};

// "535V+4RQ, Kaya Seru Largu, Willemstad, Curaçao" → "Kaya Seru Largu, Willemstad"; naam vooraan en land achteraan weg
export function adresKort(x) {
  let a = String(x.adres || '').trim();
  a = a.replace(/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\s*,?\s*/i, '');
  const n = String(x.naam || '').trim(); if (n && a.toLowerCase().startsWith(n.toLowerCase())) a = a.slice(n.length).replace(/^\s*,\s*/, '');
  a = a.replace(/,\s*(Curaçao|Curacao|Curazao|Kòrsou)\s*$/i, '').trim();
  return a || String(x.plaats || '').trim();
}
// +59997384660 → +599 9 738 4660 (Curaçao); andere nummers zoals ze zijn
export function telMooi(t) {
  const d = String(t || '').replace(/[^\d]/g, '');
  if (/^5999\d{7}$/.test(d)) return '+599 9 ' + d.slice(4, 7) + ' ' + d.slice(7);
  if (/^9\d{7}$/.test(d)) return '+599 9 ' + d.slice(1, 4) + ' ' + d.slice(4);
  return String(t || '').trim();
}
export function afstandKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
  const R = 6371, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lng - a.lng) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
export const afstandTekst = (km, locale) => km < 1 ? Math.max(100, Math.round(km * 10) * 100) + ' m' : (Math.round(km * 10) / 10).toLocaleString(locale, { maximumFractionDigits: 1 }) + ' km';

// lijstrij voor een andere zaak (naam, korte plek, afstand of score)
// NAMEN IN HOOFDLETTERS uit Google-profielen leesbaar maken ("PRICE LESS MINIMARKET" → "Price Less Minimarket"); korte afkortingen blijven
export const leesbaar = t => String(t || '').split(', ').map(s => /[A-ZÀ-Ý]{4}/.test(s) && s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(\/-])(\p{L})/gu, (m, a, c) => a + c.toUpperCase()) : s).join(', ');
export function rij(url, y, rechts) {
  return '<a class="bz-rij" href="' + esc(url) + '" data-out="ander"><span class="bz-rn"><b>' + esc(leesbaar(y.naam)) + '</b><small>' + esc(leesbaar(adresKort(y))) + '</small></span><span class="bz-rr">' + rechts + '</span></a>';
}

// Alleen deze pagina's: strak, Curaçao-kleuren, één gevulde knop, geen grijs (huisstijl CLAUDE.md todayin)
export const UX_CSS = '.bz-meta{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:0 0 6px}.bz-meta .nu{margin:0}.bz-sc{font-weight:700;font-size:17px}.bz-sc small{font-weight:500;font-size:14px;margin-left:4px}'
  + '.bz-plek{font-size:17px;margin:0 0 16px;line-height:1.45}'
  + 'main .tik{margin:0 0 18px}main .tik a.bz-btn{color:#002B7F!important}main .tik a.bz-btn.hoofd{color:#fff!important}main .tik a.bz-btn.wa{color:#063!important}main .tik.rb a.bz-btn.hoofd{background:#EEF1FC;border-color:#D5DBF3;color:#002B7F!important}main .tik.rb a.bz-btn.rt{background:#002B7F;border-color:#002B7F;color:#fff!important;order:-1}'
  + '.bz-feit{margin:0 0 22px;padding:4px 18px;border-radius:16px;background:#EEF1FC}.bz-feit>div{display:flex;gap:14px;padding:12px 0;border-top:1px solid #D5DBF3}.bz-feit>div:first-child{border-top:0}.bz-feit dt{flex:0 0 88px;font-size:14px;font-weight:700;color:#002B7F;padding-top:2px}.bz-feit dd{margin:0;min-width:0;font-size:17px;line-height:1.45;overflow-wrap:anywhere}.bz-feit dd a{color:#111113;font-weight:600}'
  + '.bz-feit details{margin:4px 0 0}.bz-feit summary{cursor:pointer;font-size:14px;font-weight:700;color:#002B7F;list-style:none}.bz-feit summary::-webkit-details-marker{display:none}.bz-feit summary:after{content:" ▾"}.bz-wk{display:grid;grid-template-columns:auto 1fr;gap:2px 14px;margin:8px 0 0;font-size:15px}.bz-wk b{font-weight:700}'
  + 'main h2.bz-h{font-size:20px;margin:26px 0 6px}.bz-l{margin:0}a.bz-rij{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #D5DBF3;text-decoration:none;color:#111113!important}.bz-rn{display:flex;flex-direction:column;min-width:0}.bz-rn b{font-weight:600;font-size:17px;overflow-wrap:anywhere}.bz-rn small{font-size:14px;margin-top:1px}.bz-rr{white-space:nowrap;font-weight:700;font-size:15px;color:#002B7F}'
  + '.bz-alle{margin:12px 0 0;font-weight:700}.bz-bron{font-size:13px;margin:22px 0 0}.eig{margin-top:26px}.eig h2{font-size:18px;margin:0 0 4px}.eig p{font-size:16px;line-height:1.5}'
  + '#bz-vraagb:empty{display:none}#bz-vraagb form.cwq{margin:0 0 18px!important}.rv{margin-top:6px}.rv h2{font-size:20px}'
  + '@media (prefers-color-scheme:dark){.bz-feit{background:#18224A}.bz-feit>div{border-color:#2C3A72}.bz-feit dt,.bz-feit summary,.bz-rr{color:#C9D3F5}.bz-feit dd a,a.bz-rij{color:#F2F4FA!important}a.bz-rij{border-color:#2C3A72}main .tik a.bz-btn{color:#C9D3F5!important}main .tik a.bz-btn.hoofd,main .tik.rb a.bz-btn.rt{color:#002B7F!important}main .tik.rb a.bz-btn.hoofd{background:#18224A;border-color:#2C3A72;color:#C9D3F5!important}main .tik.rb a.bz-btn.rt{background:#F9E814;border-color:#F9E814}}';

// Clickmind-proef in de pagina: beslissing per bezoeker (7 dagen bewaard), versies tonen, gezien en elke tik terugmelden; tikken per blok tellen
export const uxJs = API => '(function(){if(navigator.webdriver)return;var S="curbedrijf",O=' + JSON.stringify(API || '') + ',K="cwux1",st=null,ua=navigator.userAgent,c=/iPhone|iPad|iPod/.test(ua)?"i":/Android/.test(ua)?"a":"d";'
  + 'function q(s){return document.querySelector(s)}function hit(k){try{window.__curHit&&window.__curHit(k)}catch(e){}}'
  + 'try{st=JSON.parse(localStorage.getItem(K)||"null")}catch(e){}if(st&&(!st.d||!st.v||Date.now()-Date.parse(st.d)>6*864e5))st=null;'
  + 'function stuur(o){if(!st)return;o.site=S;o.pid=st.pid;o.d=st.d;o.r=st.r;var j=JSON.stringify(o);try{if(!(navigator.sendBeacon&&navigator.sendBeacon(O+"/api/mm/proefev",new Blob([j],{type:"text/plain"}))))fetch(O+"/api/mm/proefev",{method:"POST",body:j,keepalive:true,headers:{"content-type":"text/plain"}})}catch(e){}}'
  + 'function zet(){var v=st.v||{},z={},n=0;var t=q(".tik[data-uxf]");if(t&&v.knop){if(v.knop==="b")t.classList.add("rb");z.knop=v.knop;n++}'
  + 'document.querySelectorAll("[data-ux]").forEach(function(el){var p=el.getAttribute("data-ux").split(":");if(v[p[0]])el.hidden=v[p[0]]!==p[1]});'
  + 'if(v.buurt&&q("[data-ux=\\"buurt:a\\"]")&&q("[data-ux=\\"buurt:b\\"]")){z.buurt=v.buurt;n++}'
  + 'var rv=q("#reviews"),rb=q("#bz-rvb");if(rv&&rb&&v.rv){if(v.rv==="b")rb.parentNode.insertBefore(rv,rb);z.rv=v.rv;n++}'
  + 'var f=q("form.cwq"),vb=q("#bz-vraagb");if(f&&vb&&v.vraag){if(v.vraag==="b")vb.appendChild(f);z.vraag=v.vraag;n++}'
  + 'if(v.vandaag&&q("[data-ux=\\"vandaag:b\\"]")){z.vandaag=v.vandaag;n++}if(n)stuur({e:"zie",c:c,v:z})}'
  + 'if(st)zet();else if(window.fetch)fetch(O+"/api/mm/proefkies?site="+S+"&c="+c,{credentials:"omit"}).then(function(r){return r.json()}).then(function(j){if(j&&j.ok&&j.aan&&j.pid){st={pid:j.pid,d:j.d,r:j.r,v:j.v};try{localStorage.setItem(K,JSON.stringify(st))}catch(e){}zet()}}).catch(function(){});'
  + 'hit("bz-view");var bl={};'
  + 'document.addEventListener("click",function(e){var m=q("main");if(!m||!m.contains(e.target)||!e.target.closest)return;var a=e.target.closest("a,button,summary,input,textarea,select");if(!a)return;'
  + 'var b=e.target.closest("[data-blok]"),bn=b?b.getAttribute("data-blok"):(e.target.closest("form.cwq")?"vraag":(e.target.closest(".cwa")?"mail":""));if(bn&&!bl[bn]){bl[bn]=1;hit("bz-"+bn)}'
  + 'var o=a.getAttribute("data-out")||"",s="tik";if(/-tel$/.test(o))s="bel";else if(/-wa$/.test(o))s="wa";else if(/-route$/.test(o))s="route";else if(/^g-/.test(o)&&a.target==="_blank")s="site";else if(o==="eig")s="claim";else if(o==="ander")s="ander";else if(a.closest(".rv-k"))s="ster";stuur({e:s})},true);'
  + 'document.addEventListener("submit",function(e){var f=e.target;if(f&&f.classList&&f.classList.contains("cwq")){if(!bl.vraag){bl.vraag=1;hit("bz-vraag")}stuur({e:"vraag"})}},true)})();';

// tikken per blok over de laatste dagen (uit de bestaande teller cur:t:<dag>:bz-<blok>), per 100 bezoeken van een bedrijfspagina
export const BLOKKEN = ['knoppen', 'feiten', 'reviews', 'vraag', 'mail', 'buurt', 'vandaag', 'gevonden', 'eig'];
export async function uxStand(kv, dagen = 7) {
  const ds = Array.from({ length: Math.min(30, dagen) }, (_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const ks = []; ds.forEach(d => ['view', ...BLOKKEN].forEach(b => ks.push('cur:t:' + d + ':bz-' + b)));
  const v = await kv.mget(...ks).catch(() => []); let i = 0; const per = {}, tot = { view: 0 };
  for (const d of ds) { const r = {}; for (const b of ['view', ...BLOKKEN]) { const x = Number(v[i++]) || 0; if (x) { r[b] = x; tot[b] = (tot[b] || 0) + x; } } if (Object.keys(r).length) per[d] = r; }
  const per100 = {}; if (tot.view) for (const b of BLOKKEN) if (tot[b]) per100[b] = Math.round(1000 * tot[b] / tot.view) / 10;
  return { uitleg: 'Bezoeken van een bedrijfspagina (view) en per blok hoe vaak iemand daar iets aantikte (eerste tik per blok per bezoek); per100 = per 100 bezoeken. Versies en waarde: /api/mm/proefstand?site=curbedrijf&vorm=tekst', dagen: ds.length, totaal: tot, per100, perDag: per };
}
