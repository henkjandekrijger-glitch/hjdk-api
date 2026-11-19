// Leesbare tekstblokken (19 nov 2026, Henkjan bij "Waar je op moet letten" op de raamrobot: "Ziet er ook weer niet uit . Onleesbaar ."; UX-review:
// 43 keuzehulpen hebben een uitleg van meer dan 600 tekens in één alinea, met cijfers en bronnen tussen haakjes door de zin).
// Regel: een lang blok wordt een korte openingszin plus een lijst met één punt per zin (hoogstens 7), en korte bronvermeldingen tussen haakjes
// ("(Ecovacs)", "(Coolblue)") gaan uit de zin naar één regel "Bronnen: ..." onder het blok. Korte teksten blijven één alinea.
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function zinnen(t) {
  return String(t || '').replace(/\s+/g, ' ').trim().split(/(?<=[.!?])\s+(?=[A-Z0-9ÀÁÉÈÖÜ"'(])/).map(s => s.trim()).filter(Boolean);
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
export const LEESBAAR_CSS = '.ls-lijst{margin:8px 0 12px;padding-left:20px}.ls-lijst li{margin:0 0 8px;line-height:1.6}.ls-bron{font-size:13px!important;color:#111113!important;margin:6px 0 0}';
