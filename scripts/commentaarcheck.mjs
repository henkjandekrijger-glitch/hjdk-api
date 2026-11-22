// Commentaarcheck (22 nov 2026): drie keer in twee dagen schoof code achter een //-commentaar op dezelfde regel
// (21 nov keuzehulpen 30 min een 500, 20-22 nov pxVerwerk zonder kassatellers, 22 nov alle organische links "post is not defined").
// Zoekt in fn/ en lib/ naar een //-commentaar met daarin "const x =" of "let x =", waarbij x in de 40 regels eromheen wel gebruikt
// maar daar nergens anders gedeclareerd wordt. Dat is precies deze fout; gewone tekst in commentaar valt er niet onder.
import fs from 'node:fs';
const fouten = [];
for (const map of ['lib', 'fn']) {
  const d = new URL('../' + map + '/', import.meta.url);
  for (const f of fs.readdirSync(d)) {
    if (!/\.m?js$/.test(f)) continue;
    const tekst = fs.readFileSync(new URL(f, d), 'utf8'); const regels = tekst.split('\n');
    regels.forEach((r, i) => {
      const m = r.match(/(^|[\s;)}\]])\/\/(.*)$/); if (!m) return; // // na witruimte of einde statement (niet https:// of \/\/ in een regex)
      for (const d2 of m[2].matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/g)) {
        const naam = d2[1]; const esc = naam.replace(/\$/g, '\\$');
        const zonder = regels.slice(Math.max(0, i - 40), i).join('\n') + '\n' + r.slice(0, m.index + m[1].length) + '\n' + regels.slice(i + 1, i + 40).join('\n'); // alleen de omgeving: in grote bestanden heet een variabele elders vaak hetzelfde
        const gedeclareerd = [ '\\b(?:const|let|var|function|class)\\s+' + esc + '\\b', '\\b(?:const|let|var)\\s*[{\\[][^}\\]]*\\b' + esc + '\\b', '\\(([^()]*\\b' + esc + '\\b[^()]*)\\)\\s*=>', '\\b' + esc + '\\s*=>', 'function\\s*[\\w$]*\\s*\\([^)]*\\b' + esc + '\\b', 'catch\\s*\\(\\s*' + esc + '\\b', 'import\\s*\\{[^}]*\\b' + esc + '\\b', 'import\\s+' + esc + '\\b' ].some(p => new RegExp(p).test(zonder));
        const gebruikt = new RegExp('\\b' + esc + '\\b').test(zonder);
        if (gebruikt && !gedeclareerd) fouten.push(map + '/' + f + ':' + (i + 1) + ' "' + naam + '" staat alleen in een //-commentaar gedeclareerd: ' + r.trim().slice(0, 120));
      }
    });
  }
}
if (fouten.length) { console.error('Build gestopt: code achter een //-commentaar\n' + fouten.join('\n')); process.exit(1); }
console.log('ok   geen code achter //-commentaar');
