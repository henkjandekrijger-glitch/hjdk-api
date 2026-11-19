// 19 nov 2026: Whop keurde twee Kadoly-advertenties af ("Explicit sexual content": producten in de vorm van blote geslachtsdelen en
// borsten bij de aanbevolen producten op de landingspagina). Zulke producten komen nooit in "Ook populair vandaag", in een advertentie of
// in een gids. Henkjan 19 nov: "Ja doe dat vraag dat ." (de shop haalt ze ook van kadoly.com, TAAK in lib/shopprompt.js).
// Op titel (Label2X- en Vivi-lijntekeningen van lichamen, billen, naakt) plus vaste ids na controle van de foto.
export const GEVOELIG_RE = /\b(naakt|naked|nudes?|bums?|billen|kontje|torso|borsten|tieten|boobs?|tits|piemel|penis|vagina|vulva|lul|erotisch|sexy|seks|sex)\b|lichaamslijn|lijntekening|line ?art|\bdama\b|voor vrouwen/i;
export const GEVOELIG_IDS = new Set([
  'oc_4174004500398081', // 'Laten We Naakt Gaan' plaque
  'oc_4174004682178562', // tegel 'All Bums'
  'oc_4174004630552578', // ovaal lichaamslijn
  'oc_4174004631650305', // ovaal vrouwen lijntekening
  'oc_4174004638973955', // ovaal kunst voor vrouwen
  'oc_4174004632600578', // ovaal lijntekening
  'oc_4174004630306818', // ovaal lijn kunst
  'oc_4174004463386625', // poster lijntekening dama
  'oc_4174004492648449', // poster line art dama
]);
export const gevoelig = i => !!i && (GEVOELIG_IDS.has(i.id) || GEVOELIG_RE.test(String(i.t || i.titel || '') + ' ' + String(i.s || '')));
