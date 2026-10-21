// FAQ zonder herhaling (ZICHT dagcontrole 21 okt 2026).
// De Search Console-ronde (api/gsc.js) voegt per dag FAQ toe. Daardoor stonden op o.a. /kinderfiets vier bijna gelijke
// vragen ("Hoe bepaal je de juiste maat", "Hoe bepaal je welke fietsgrootte", "Hoe meet je de juiste maat", twee keer "8 jaar")
// met elkaar tegensprekende getallen. Dat oogt als AI-opvulling. Regel: een automatisch toegevoegde vraag (bron search-console)
// valt weg als hij inhoudelijk dezelfde is als een eerdere vraag. Handgeschreven vragen blijven altijd staan.
const STOP = new Set('hoe wat welke welk wie waar wanneer waarom is zijn de het een en of je jij jouw jullie mijn ik mag moet kan kun kunnen voor van bij in op met aan te om tot dan als dat dit die er nodig heeft hebben heb best beste juiste goede belangrijk verschil tussen verschillende soorten meestal echt wel niet ook how what which who where when why is are the a an and or you your my i do does should can for of at in on with to need right best good welche welcher welches wie was ist sind der die das ein eine und oder du dein deine ich soll sollte kann fur für von bei mit zu richtige beste gut'.split(' '));
const SYN = [[/^(fietsgrootte|grootte|framemaat|wielmaat|maten|afmeting|afmetingen|inch|size|sizes|größe|grosse)$/, 'maat'], [/^(bepaal|bepalen|meet|meten|kies|kiezen|berekenen|bereken|weet|weten|vind|vinden|choose|pick|measure|wählen|messen)$/, 'bepalen'], [/^(jarig|jarige|jaar|leeftijd|jaren|years|old|jahre|alt)$/, 'jaar'], [/^(kinderen|kinderfiets|kinderfietsen|kids|child|kinder)$/, 'kind']];
function woorden(q) {
  return [...new Set(String(q || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/(\d+)\s*-?\s*(jarig|jarige)/g, '$1 jaar').split(/[^a-z0-9]+/)
    .filter(w => w && !STOP.has(w)).map(w => { for (const [re, n] of SYN) if (re.test(w)) return n; return w; }))];
}
function lijkt(a, b) { if (!a.length || !b.length) return false; const na = a.filter(w => /^\d/.test(w)).join(), nb = b.filter(w => /^\d/.test(w)).join(); if (na !== nb && (na || nb)) return false; /* andere leeftijd, maat of budget is een andere vraag */ const B = new Set(b); const gedeeld = a.filter(w => B.has(w)).length; return gedeeld / Math.min(a.length, b.length) >= 0.75 || gedeeld / new Set([...a, ...b]).size >= 0.6; }
export function faqZonderDubbel(faq) {
  if (!Array.isArray(faq) || faq.length < 2) return faq;
  const gehouden = [], sleutels = [];
  for (const f of faq) {
    const q = f && (f.q || f[0]); const w = woorden(q);
    if (f && f.bron === 'search-console' && sleutels.some(s => lijkt(w, s))) continue;
    gehouden.push(f); sleutels.push(w);
  }
  return gehouden;
}
