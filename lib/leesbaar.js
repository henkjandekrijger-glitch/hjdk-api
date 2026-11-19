// Leesbare tekstblokken (19 nov 2026, Henkjan bij "Waar je op moet letten" op de raamrobot: "Ziet er ook weer niet uit . Onleesbaar ."; UX-review:
// 43 keuzehulpen hebben een uitleg van meer dan 600 tekens in één alinea, met cijfers en bronnen tussen haakjes door de zin).
// Regel: een lang blok wordt een korte openingszin plus een lijst met één punt per zin (hoogstens 7), en korte bronvermeldingen tussen haakjes
// ("(Ecovacs)", "(Coolblue)") gaan uit de zin naar één regel "Bronnen: ..." onder het blok. Korte teksten blijven één alinea.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function zinnen(t) {
  const z = String(t || '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9ÀÁÉÈÖÜ"'(])/).map(s => s.trim()).filter(Boolean);
  // een vraag hoort bij het antwoord erna ("Need a room tonight? Check HotelTonight") en een zin die eindigt op een dubbele punt ook
  const o = []; z.forEach(s => { const v = o[o.length - 1]; if (v && /[?:]$/.test(v)) o[o.length - 1] = v + ' ' + s; else o.push(s); }); return o;
}

// Haalt korte bronnen tussen haakjes uit de tekst: één tot vier woorden met een hoofdletter, geen cijfers, geen "bijv.".
export function bronnenEruit(t) {
  const b = [];
  const uit = String(t || '').replace(/\s*\(([A-Z][\w&.'\- ]{1,40}?)(?:,\s*([A-Z][\w&.'\- ]{1,40}?))?\)/g, (m, a, c) => {
    const ok = x => x && !/\d/.test(x) && !/^(bijv|bijvoorbeeld|zie|ook|of|en|dus|let op)\b/i.test(x) && x.split(/\s+/).length <= 4;
    if (!ok(a) || (c && !ok(c))) return m;
    const bron = (c || a).trim(); if (!b.includes(bron)) b.push(bron);
    return c ? ' (' + a.trim() + ')' : ''; // "(TruEdge, Ecovacs)": TruEdge blijft in de zin, Ecovacs is de bron
  });
  return { tekst: uit.replace(/\s+([.,;:])/g, '$1'), bronnen: b };
}

// lk = functie die geescapete tekst van links voorziet (zoals in api/kz.js); zonder lk wordt alleen geescaped.
export function leesbaarBlok(t, lk, o) {
  o = o || {}; const f = lk || esc, max = o.max || 9;
  const { tekst, bronnen } = bronnenEruit(t);
  const z = zinnen(tekst);
  const bron = bronnen.length ? `<p class="ls-bron">${o.bronLabel || 'Bronnen'}: ${esc(bronnen.join(', '))}.</p>` : '';
  if (tekst.length <= 320 || z.length < 3) return `<p>${f(tekst)}</p>` + bron;
  const kop = z[0], rest = z.slice(1);
  const punten = rest.length > max ? rest.slice(0, max - 1).concat([rest.slice(max - 1).join(' ')]) : rest;
  return `<p>${f(kop)}</p><ul class="ls-lijst">${punten.map(p => `<li>${f(p)}</li>`).join('')}</ul>` + bron;
}
export const LEESBAAR_CSS = '.ls-kop{font-size:16px!important;font-weight:700;margin:18px 0 4px!important;color:#111113}.ls-lijst{margin:8px 0 12px;padding-left:20px}.ls-lijst li{margin:0 0 8px;line-height:1.6}.ls-bron{font-size:13px!important;color:#111113!important;margin:6px 0 0}';

// Antwoordblok bovenaan (UX-review US/DE 19 nov 2026: 9 tot 23 regels, vette zin van 7 regels): de eerste zin vet, daarna hoogstens 2 zinnen;
// wat er meer is komt als korte lijst (hoogstens 5 punten), bronnen in één regel eronder.
export function antwoordBlok(t, o) {
  o = o || {}; const { tekst, bronnen } = bronnenEruit(t); const z = zinnen(tekst); if (!z.length) return '';
  const kop = '<p><strong>' + esc(z[0]) + '</strong>' + (z.length > 1 ? ' ' + esc(z[1]) : '') + '</p>';
  const rest = z.slice(2), lijst = rest.length ? '<ul class="ls-lijst">' + (rest.length > 5 ? rest.slice(0, 4).concat([rest.slice(4).join(' ')]) : rest).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '';
  return kop + lijst + (bronnen.length ? '<p class="ls-bron">' + (o.bronLabel || 'Bronnen') + ': ' + esc(bronnen.join(', ')) + '.</p>' : '');
}

// Uitleg met alinea's (guide): een alinea die begint met een kort kopje als zin ("Prices.", "AC oder DC.") krijgt dat als tussenkop; de rest via leesbaarBlok.
export function gidsBlok(guide, o) {
  o = o || {};
  return String(guide || '').split(/\n+/).map(p => p.trim()).filter(Boolean).map(p => {
    const m = p.match(/^([^.!?]{2,40}[.!?:])\s+(.+)$/), kort = m && m[1].split(/\s+/).length <= 5;
    return (kort ? '<h3 class="ls-kop">' + esc(m[1].replace(/[.:]$/, '')) + '</h3>' : '') + leesbaarBlok(kort ? m[2] : p, null, o);
  }).join('');
}
