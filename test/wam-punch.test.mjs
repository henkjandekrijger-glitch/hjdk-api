import test from 'node:test';
import assert from 'node:assert/strict';
import { punchRonde, punchSlots, PUNCH } from '../lib/wam-punch.js';

function nepKv() {
  const m = new Map(), h = new Map(); h.set('mm:pf:wmn:4', new Map([['punch|b|i|n', '80'], ['punch|b|i|s', '3'], ['punch|a|i|n', '90'], ['lkop|a|i|n', '5']]));
  return { m, h, get: async k => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); },
    raw: async c => { const [op, k, ...r] = c;
      if (op === 'SET') { if (r.includes('NX') && m.has(k)) return null; m.set(k, r[0]); return 'OK'; }
      if (op === 'HKEYS') return [...(h.get(k) || new Map()).keys()];
      if (op === 'HDEL') { const x = h.get(k); r.forEach(f => x && x.delete(f)); return r.length; }
      if (op === 'LPUSH') { const l = m.get(k) || []; l.unshift(r[0]); m.set(k, l); return l.length; }
      if (op === 'LTRIM') return 'OK'; if (op === 'LRANGE') return m.get(k) || []; return null; } };
}
const stand = { ok: true, ronde: 4, factoren: [{ id: 'punch', versies: [
  { id: 'a', gezien: 90, waarde: 9, kansBeste: 70 }, { id: 'b', gezien: 80, waarde: 0.04, kansBeste: 5 }, { id: 'c', gezien: 70, waarde: 2, kansBeste: 15 }, { id: 'd', gezien: 60, waarde: 1, kansBeste: 10 }] }] };

test('punchlines: de leider blijft, de zwakste plek krijgt een nieuwe uitdager en lege tellers, een keer per dag', async () => {
  const kv = nepKv(), nu = Date.parse('2026-11-27T07:00:00Z');
  const r = await punchRonde(kv, { nu, stand });
  assert.equal(r.leider.plek, 'a'); assert.equal(r.eruit.plek, 'b'); assert.equal(r.erin.id, 'p05');
  const s = await punchSlots(kv); assert.equal(s.slots.a, 'p01'); assert.equal(s.slots.b, 'p05'); assert.equal(s.sinds.b, '2026-11-27');
  assert.ok(!kv.h.get('mm:pf:wmn:4').has('punch|b|i|n') && kv.h.get('mm:pf:wmn:4').has('punch|a|i|n') && kv.h.get('mm:pf:wmn:4').has('lkop|a|i|n'));
  assert.ok((await punchRonde(kv, { nu, stand })).al, 'tweede keer op dezelfde dag doet niets');
  assert.ok((await punchRonde(nepKv(), { nu: Date.parse('2026-11-27T05:00:00Z'), stand })).wacht);
  assert.ok(PUNCH.every(p => p.kop.length <= 60 && p.quote.split(' ').length < 15), 'kort en citaten onder 15 woorden');
});

test('volgen met één tik onder het beeld op voorkant en /start', async () => {
  const p = await import('../lib/wam-punch.js'), d = await import('../lib/wam-dossier.js');
  const v = p.manifest(p.STANDAARD_SLOTS);
  assert.ok(v.indexOf('data-mvolg') > v.indexOf('manifest-beeld') && v.indexOf('data-mvolg') < v.indexOf('id="voor-kop"'));
  assert.ok(d.pagina('start', true, false, [], {}).includes('data-mvolg'));
  assert.ok(p.MANIFEST_JS.includes('wamMeld') && p.MANIFEST_JS.includes("waar:'beeld'"));
});
