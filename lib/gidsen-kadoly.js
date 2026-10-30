// De gidsen van gids.kadoly.com (api/gids.js). Elke gids is met de hand geschreven op echte productfeiten uit de shop; geen massapagina's.
// Velden: slug, titel (hooguit 60 tekens), beschrijving (hooguit 155), kicker, h1, kort, keuze [{pid, label, waarom, beperking}],
// tabelKop, tabel [{situatie, advies, pid}], check {vragen [{k, vraag, opties [[waarde, label]]}], regels [{id, als {k: [waarden]}, kop, tekst, pid}]},
// uitleg [{kop, alineas}], zoKozenWe, faq [{v, a}], bijgewerkt (JJJJ-MM-DD).
export const GIDSEN = {};
export const GIDS_IDS = Object.keys(GIDSEN);
