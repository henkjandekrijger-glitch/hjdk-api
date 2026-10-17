import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const src=await fs.readFile(new URL('../lib/overdracht-page.js',import.meta.url),'utf8');
const {handoverHtml}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
test('handover is safe HTML with daily table, real counts, links and collapsible instructions',()=>{
 const text='# Overdracht (live)\n\nLive versie: abc123\n\n## Dagmeting verkeer en gebruik (Curaçao)\n\n- keuzehulp.best: 383 keuzehulpen.\n- whichtobuy.best: 93 keuzehulpen.\n- kaufberater.best: 69 keuzehulpen.\n- Totaal: 545 keuzehulpen.\n### 2026-10-17 (lopend)\n- kz: externe bronweergaven 5; FP-weergaven 2, gidsweergaven 1, gebruik 1, daarvan vanuit FP 1, geldig voor trending 0.\n- us: externe bronweergaven 3; nieuwe gebruiksmeting nog niet actief op deze dag.\n\n## Werkinstructie\n\n- Bekijk https://keuzehulp.best/ en `lib/x.js`.\n- <script>alert(1)</script> **veilig** [fout](javascript:alert(2))\n';
 const html=handoverHtml(text);assert.match(html,/<strong>545<\/strong>/);assert.match(html,/<strong>383<\/strong>/);assert.match(html,/<table>/);assert.match(html,/Meting nog niet gestart/);assert.match(html,/format=txt/);assert.match(html,/href="https:\/\/keuzehulp.best\/"/);assert.match(html,/<code>lib\/x.js<\/code>/);assert.doesNotMatch(html,/<script>alert/);assert.doesNotMatch(html,/href="javascript:/);assert.match(html,/&lt;script&gt;/);assert.match(html,/<details class="panel" id="deel-1" open/);assert.match(html,/<details class="panel" id="deel-2">/);
});
