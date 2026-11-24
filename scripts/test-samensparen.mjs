// Test van Samen sparen, de clubs en de clubwerving (23 nov 2026, overdracht OVERDRACHT-SAMEN-SPAREN.md).
// Draait zonder sleutels en zonder netwerk: kopieert lib/*.js naar een tijdelijke map, zet daar de nepversies uit
// scripts/test-samensparen/stub-*/ overheen (kv in het geheugen, mails opgevangen, Clickmind en de POST-lus nep)
// en draait de proeven:
//   leden    scripts/test-samensparen/leden.mjs     hele keten lid, vriend, club, retour, volle kaart, inwisselen (43 checks)
//   clubs    scripts/test-samensparen/clubs.mjs     clubs vinden (OSM, sites), mail, nooit-bekend, antwoorden, leren, afmelden (39 checks)
//   doorloop scripts/test-samensparen/doorloop.mjs  de doorloop-pagina zonder ZERNIO_MAIL_ACCOUNT (pad dat in productie brak)
// Gebruik: node scripts/test-samensparen.mjs            alle proeven
//          node scripts/test-samensparen.mjs --schermen <map>  ook de schermen en mails als HTML in <map> (voor schermafdrukken)
// Slaagt alleen als er geen regel "FOUT" is en elk proces met 0 eindigt.
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = join(REPO, 'scripts', 'test-samensparen');
const arg = process.argv.slice(2), schermen = arg.includes('--schermen') ? arg[arg.indexOf('--schermen') + 1] : '';
const tmp = mkdtempSync(join(tmpdir(), 'samensparen-'));
let fout = 0;

function opzet(naam, stub, aanpas) {
  const d = join(tmp, naam), l = join(d, 'lib'); mkdirSync(l, { recursive: true });
  for (const f of readdirSync(join(REPO, 'lib'))) if (f.endsWith('.js')) copyFileSync(join(REPO, 'lib', f), join(l, f));
  for (const f of readdirSync(join(T, stub))) copyFileSync(join(T, stub, f), join(l, f));
  for (const [f, a, b] of aanpas) { const p = join(l, f); const s = readFileSync(p, 'utf8'); if (!s.includes(a)) throw new Error(naam + ': ' + f + ' bevat "' + a + '" niet meer, pas de test aan'); writeFileSync(p, s.replace(a, b)); }
  return d;
}
function draai(d, script) {
  copyFileSync(join(T, script), join(d, script)); mkdirSync(join(d, 'ss2'), { recursive: true });
  const r = spawnSync(process.execPath, [script], { cwd: d, encoding: 'utf8', env: { ...process.env, ZERNIO_API_KEY: '', ZERNIO_MAIL_ACCOUNT: '' }, timeout: 120000 });
  const uit = (r.stdout || '') + (r.stderr || '');
  const ok = (uit.match(/^ok /gm) || []).length, fouten = uit.split('\n').filter(x => /^FOUT/.test(x) || /Error/.test(x));
  const goed = r.status === 0 && !fouten.length;
  if (!goed) { fout++; console.log(uit.slice(-3000)); }
  console.log((goed ? 'GOED ' : 'FOUT ') + script + ': ' + ok + ' checks' + (fouten.length ? ', ' + fouten.length + ' fout' : '') + (r.status ? ', exit ' + r.status : ''));
}

try {
  const leden = opzet('leden', 'stub-leden', [['dagkans.js', "from './kadoly-nieuws.js'", "from './nieuws-nep.js'"]]);
  if (schermen) { draai(leden, 'leden-schermen.mjs'); }
  draai(leden, 'leden.mjs');
  if (schermen) { mkdirSync(schermen, { recursive: true }); for (const f of readdirSync(join(leden, 'ss2'))) copyFileSync(join(leden, 'ss2', f), join(schermen, f)); console.log('schermen in ' + schermen); }
  const clubs = opzet('clubs', 'stub-clubs', [['partner.js', 'export const LIVE = false;', 'export const LIVE = true;']]);
  draai(clubs, 'clubs.mjs');
  draai(clubs, 'doorloop.mjs');
} finally { if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true }); }
console.log(fout ? '\nNIET GOED: ' + fout + ' proef(en) faalden' : '\nALLES GOED');
process.exit(fout ? 1 : 0);
