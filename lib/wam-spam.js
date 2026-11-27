// Spamwering voor alles wat lezers insturen op wearemany.now (Henkjan 27 nov 2026: "Zorg dat spam er niet in kan komen").
// Aanleiding: drie keer dezelfde Russische tekst als lezersreactie bij Blendle, ANP en Errezeta, en melders over "Fvdg" en "Ygicuc7".
// Pure functies (ruimSpam onderaan leest en schrijft wel). Gebruikt door lib/wam-reacties.js (lezersreacties, voor de moderatie) en lib/wam-dossier.js
// (meldingen op /start: getypte bedrijfsnaam en wat de AI eruit leest). Een geweigerde invoer krijgt een gewone uitleg terug,
// nooit een ontvangstbevestiging, en telt per dag in wmn:d:<dag> (spamreactie, spamnaam) zodat op=dstand laat zien dat de wering werkt.

const KLINKER = /[aeiouy]/;
// Rijen van het toetsenbord (qwerty, qwertz, azerty): wie daarop slaat typt geen klacht of bedrijfsnaam.
// Vijf tekens op een rij, of een woord dat precies een korte rij is (asdf): 'erty' zit ook in Riverty en property.
const TOETSEN = ['qwert', 'werty', 'ertyu', 'rtyui', 'tyuio', 'yuiop', 'asdfg', 'sdfgh', 'dfghj', 'fghjk', 'ghjkl', 'zxcvb', 'xcvbn', 'cvbnm', 'yxcvb', 'azert', 'qsdfg'];
const KORT = new Set(['qwer', 'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'jkl', 'zxcv', 'xcvb', 'cvbn', 'vbnm', 'uiop', 'yxcv', 'azer', 'qsdf']);
const geklop = w => KORT.has(w) || TOETSEN.some(k => w.includes(k));

const RECHTSVORM = new Set(['bv', 'nv', 'vof', 'cv', 'gmbh', 'ltd', 'llc', 'plc', 'inc', 'srl', 'spa', 'sa', 'ag', 'kg', 'bvba', 'sarl', 'sl', 'ab', 'oy', 'as']);
const zonderAccent = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
const letters = s => String(s || '').match(/\p{L}/gu) || [];
const latijns = c => /\p{Script=Latin}/u.test(c);

// Geeft de reden terug als een lezersreactie spam is, anders een lege tekst.
export function spamTekst(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  const l = letters(t);
  if (l.length < 12) return 'kort';
  // De dossiers zijn Nederlands, Engels, Duits en Italiaans: alles in Latijns schrift.
  if (l.filter(latijns).length / l.length < 0.8) return 'schrift';
  const woorden = zonderAccent(t).toLowerCase().match(/\p{L}+/gu) || [];
  if (woorden.length < 4) return 'kort';
  if (woorden.length >= 6 && new Set(woorden).size / woorden.length < 0.4) return 'herhaling';
  const lang = woorden.filter(w => w.length >= 4);
  if (lang.length && lang.filter(w => !KLINKER.test(w)).length / lang.length > 0.3) return 'onzin';
  if (woorden.some(geklop)) return 'onzin';
  const al = woorden.join('');
  if ((al.match(/[aeiouy]/g) || []).length / al.length < 0.2) return 'onzin';
  if (/(\p{L})\1{3,}/u.test(t)) return 'onzin';
  return '';
}

// Waar als een bedrijfsnaam duidelijk geen echte naam is: willekeurige letters, toetsenbordgeklop, ander schrift.
// Afkortingen in hoofdletters (KPN, NS, VGZ, ABN AMRO, 3M) zijn wel een naam.
export function nepNaam(naam) {
  const n = zonderAccent(naam).replace(/\s+/g, ' ').trim();
  const l = letters(n);
  if (!l.length || n.replace(/\s/g, '').length < 2 || l.some(c => !latijns(c))) return true;
  if (/(\p{L})\1\1/iu.test(n.replace(/[\s.]/g, ''))) return true;
  if (/^[A-Z0-9&.+\- ]{2,14}$/.test(n)) return false;
  for (const w of n.split(/[\s\-&.,'’/+()]+/).filter(Boolean)) {
    const lw = w.toLowerCase(), alleen = lw.replace(/[^a-z]/g, '');
    if (RECHTSVORM.has(alleen)) continue;
    if (geklop(alleen)) return true;
    if (alleen.length >= 4 && !KLINKER.test(alleen) && ((w !== w.toUpperCase() && w !== w.toLowerCase()) || alleen.length > 5)) return true; // Fvdg; nmbs of vgz in kleine letters blijft een afkorting
    if (/^[a-z]{5,}\d$/i.test(w)) return true; // Ygicuc7: vijf of meer letters met één cijfer eraan vast
    if (alleen.length >= 7 && (alleen.match(/[aeiouy]/g) || []).length / alleen.length < 0.15) return true;
  }
  return false;
}

// Vaste tekst voor de lezer, per reden. Zegt wat er nodig is, geen technische uitleg.
export function spamUitleg(reden) {
  if (reden === 'schrift') return 'Schrijf je ervaring in het Nederlands, Engels, Duits of Italiaans.';
  return 'Beschrijf in een paar gewone zinnen wat er gebeurde.';
}

// Opruimronde (elk uur in op=leer, en los via op=dspam op de beschermde host): wijst wachtende lezersreacties af die de
// wering nu als spam ziet en haalt nepnamen uit de melderstelling (wmn:tel, wmn:naam). Raakt niets wat de wering doorlaat.
// Nepnamen met meer dan 3 melders blijven staan en komen in de uitkomst, zodat een mens kijkt in plaats van de code.
export async function ruimSpam(db, schrijf = false) {
  const uit = { ok: true, droog: !schrijf, reacties: [], namen: [], laten: [] };
  const ids = await db.raw(['ZRANGE', 'wmn:r:wacht', 0, 199]).catch(() => []);
  const lijst = ids.length ? await db.mget(...ids.map(id => 'wmn:r:' + id)) : [];
  for (let i = 0; i < ids.length; i++) {
    const r = lijst[i]; const reden = r ? spamTekst(r.tekst) : '';
    if (!reden) continue;
    uit.reacties.push({ id: ids[i], bedrijf: r.bedrijf, reden });
    if (schrijf) await db.raw(['EVAL', "redis.call('DEL',KEYS[1]); redis.call('ZREM',KEYS[2],ARGV[1]); return 1", 2, 'wmn:r:' + ids[i], 'wmn:r:wacht', ids[i]]);
  }
  const paar = l => { const o = {}; for (let i = 0; i + 1 < (l || []).length; i += 2) o[l[i]] = l[i + 1]; return o; };
  const nm = await db.raw(['HGETALL', 'wmn:naam']).catch(() => []), tl = await db.raw(['HGETALL', 'wmn:tel']).catch(() => []);
  const naam = Array.isArray(nm) ? paar(nm) : (nm || {}), tel = Array.isArray(tl) ? paar(tl) : (tl || {});
  for (const slug of new Set([...Object.keys(naam), ...Object.keys(tel)])) {
    const n = naam[slug] || slug;
    if (!nepNaam(n)) continue;
    if (Number(tel[slug] || 0) > 3) { uit.laten.push({ naam: n, melders: Number(tel[slug]) }); continue; }
    uit.namen.push({ naam: n, melders: Number(tel[slug] || 0) });
    if (schrijf) { await db.raw(['HDEL', 'wmn:tel', slug]); await db.raw(['HDEL', 'wmn:naam', slug]); }
  }
  return uit;
}
