// Bouwt lib/vk-sjablonen.js uit de vier ontwerpen van de voorkant (data/vk/<arm>-<markt>.html).
// Henkjan 19 nov 2026: "We gaan ze allemaal testen waar chat best converteert naar betrokken chatter die terugkomt ."
// Elk ontwerp is een volledige pagina met de chat erin. De opmaak (.kx-CSS) en het script van de chat komen live uit kzuxBlok
// (lib/kzux.js), zodat een verbetering van de chat ook in alle vier de ontwerpen doorwerkt. Dit script haalt ze eruit en zet er
// markeringen voor in de plaats: <!--KXCSS-->, <!--KXJS--> en <!--VKMEET--> (meting, vlak voor </body>).
// Gebruik: node scripts/vk-bouw.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { kzuxBlokVoorkant } from '../lib/cadeauvinder.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARMEN = ['a', 'b', 'c', 'd'], MARKTEN = ['nl', 'us', 'de'];
const uit = {}; let fout = 0;
for (const mk of MARKTEN) {
  const { css, js } = kzuxBlokVoorkant(mk);
  for (const a of ARMEN) {
    const f = path.join(ROOT, 'data/vk', a + '-' + mk + '.html');
    if (!fs.existsSync(f)) { console.error('ontbreekt', f); fout++; continue; }
    let h = fs.readFileSync(f, 'utf8');
    // het chat-script: het eerste <script> na de sectie #kx dat de chat bedient (kan een oudere versie zijn dan nu live)
    const sk = h.indexOf('id="kx"'), se = sk < 0 ? -1 : h.indexOf('</section>', sk), j = se < 0 ? -1 : h.indexOf('<script>', se), je = j < 0 ? -1 : h.indexOf('</script>', j);
    const i = h.indexOf(css);
    if (i < 0 || j < 0 || je < 0 || h.slice(j, je).indexOf('kxq') < 0) { console.error(a + '-' + mk + ': chat-CSS of chat-script niet gevonden', i, j); fout++; continue; }
    h = h.slice(0, j) + '<!--KXJS-->' + h.slice(je + 9);
    h = h.slice(0, i) + '<!--KXCSS-->' + h.slice(i + css.length);
    if (!/<\/body>/i.test(h)) { console.error(a + '-' + mk + ': geen </body>'); fout++; continue; }
    h = h.replace(/<\/body>/i, '<!--VKMEET--></body>').replace(/<html\b/i, '<html data-vk="' + a + '"');
    if (/[—]/.test(h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, ''))) { console.error(a + '-' + mk + ': gedachtestreepje in de tekst'); fout++; }
    uit[a + '-' + mk] = h;
  }
}
if (fout) { console.error(fout + ' fout(en), niets geschreven'); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'lib/vk-sjablonen.js'), '// Gemaakt door scripts/vk-bouw.mjs uit data/vk/*.html. Niet met de hand wijzigen.\nexport const VK = ' + JSON.stringify(uit) + ';\n');
console.log('lib/vk-sjablonen.js', Object.keys(uit).length, 'sjablonen');
