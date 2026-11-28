import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import * as G from '../lib/gebruikbeleid.js';
import { takenTekst } from '../lib/taken.js';

// Exercise the real dashboard entry functions without production data/network dependencies.
const source = readFileSync(new URL('../lib/dashboard.js', import.meta.url), 'utf8');
const context = vm.createContext({ console, Date, URL, URLSearchParams, Buffer });
const mod = new vm.SourceTextModule(source, { context });
await mod.link(async specifier => {
  const entries = [...source.matchAll(/import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g)].filter(x => x[2] === specifier);
  const names = [...new Set(entries.flatMap(entry => entry[1].split(',').map(x => x.trim())))];
  const values = specifier === './gebruikbeleid.js' ? G : Object.fromEntries(names.map(n => [n, n === 'POORT_KORT' ? 'VRAAGPOORT' : () => null]));
  return new vm.SyntheticModule(names, function () { for (const n of names) this.setExport(n, values[n]); }, { context });
});
await mod.evaluate();
const D = mod.namespace;
const mockKv = seed => {
  let value = seed;
  return { get: async () => value, set: async (key, next) => { value = next; }, rawValue: () => value };
};

test('saved custom guidance retains content and history while receiving current quality policy', async () => {
  const original = { tekst: 'Eigen projectspecifieke instructies blijven gelden.', bijgewerkt: '2026-11-27', wie: 'Henkjan', vorige: 'Eerdere versie.' };
  const kv = mockKv(original);
  const read = await D.leesLeerprompt(kv);
  assert.ok(read.tekst.includes(original.tekst));
  assert.ok(read.tekst.includes(G.BELEID_MARKER));
  assert.equal(read.vorige, original.vorige);
  assert.equal(kv.rawValue(), original);
  assert.equal(kv.rawValue().tekst, original.tekst);
});

test('default and already saved guidance receive policy once, including after a round trip', async () => {
  const kv = mockKv(null);
  const first = (await D.leesLeerprompt(kv)).tekst;
  assert.ok(first.includes(D.LEERPROMPT));
  assert.equal(first.split(G.BELEID_MARKER).length - 1, 1);
  assert.ok((await D.zetLeerprompt(kv, first, 'test')).ok);
  assert.equal((await D.leesLeerprompt(kv)).tekst, first);
  const edited = first + '\nEigen aanvullende afspraak.';
  assert.ok((await D.zetLeerprompt(kv, edited, 'test')).ok);
  assert.equal((await D.leesLeerprompt(kv)).tekst, edited);
  assert.ok((await D.vorigeLeerprompt(kv)).ok);
  assert.equal((await D.leesLeerprompt(kv)).tekst, first);
});

test('every project and a future project carries policy in compact and start entry points', () => {
  const projecten = [...D.PROJECTEN, { id: 'toekomstig', naam: 'Toekomstig project' }].map(p => ({
    ...p, chats: [], open: [], log: [], pct: null
  }));
  const d = { projecten, vandaag: '2026-11-28', taken: null };
  for (const p of projecten) assert.ok(D.bijTekst(d, p.id).includes(G.GEBRUIK_KORT), p.id);
  assert.ok(D.startTekst(d).includes(G.GEBRUIK_KORT));
});

test('automatic workers receive quality escalation and whole-platform guidance', () => {
  const text = takenTekst({ taken: [], gewoon: [], besluiten: [], accounts: {} }, 'claude-1', {});
  assert.ok(text.includes(G.GEBRUIK_KORT));
  assert.ok(text.includes('Begin direct sterk waar nodig'));
  assert.ok(text.includes('verlaag alleen na controle'));
  assert.ok(text.includes('vorm=leerprompt'));
  assert.ok(!text.includes('Zo kost een lichte taak geen zwaar model'));
});
