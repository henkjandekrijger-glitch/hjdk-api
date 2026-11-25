import test from 'node:test';
import assert from 'node:assert/strict';
import { bewaarArtikel } from '../lib/lcartikel-opslag.js';
function geheugen(oud) { const waarden = new Map(Object.entries(oud)); const writes = []; return { waarden, writes, get: async k => waarden.get(k), set: async (k,v) => { writes.push(k); waarden.set(k,structuredClone(v)); } }; }
test('een oude concepttaak kan de gepubliceerde goedgekeurde tekst niet vervangen of terugzetten', async () => {
  const goedgekeurd = { slug:'i-wasted-another-year', titel:'Approved review card', status:'live', secties:[{kop:'Original card'}] };
  const kv = geheugen({'lc:art:i-wasted-another-year':goedgekeurd});
  const resultaat = await bewaarArtikel(kv, {slug:goedgekeurd.slug,titel:'Different 30-day plan'}, [{slug:goedgekeurd.slug,status:'concept'}], 'eerst-zien');
  assert.equal(resultaat.status,409); assert.equal(resultaat.ok,false); assert.deepEqual(kv.waarden.get('lc:art:'+goedgekeurd.slug),goedgekeurd); assert.deepEqual(kv.writes,[]);
});
test('een nieuwe eerst-zien-opslag blijft concept en bewaart bestaande live indexregels', async () => {
  const kv=geheugen({}); const oud={slug:'how-to-start-over-in-life',status:'live'};
  const a={slug:'next-reviewed-topic',titel:'New topic',status:'live'};
  assert.equal((await bewaarArtikel(kv,a,[oud],'eerst-zien')).ok,true);
  assert.equal(kv.waarden.get('lc:art:'+a.slug).status,'concept'); assert.deepEqual(kv.waarden.get('lc:arts')[0],oud);
});
test('een ongepubliceerd concept kan nog worden gecorrigeerd zonder een tweede indexregel', async () => {
  const kv=geheugen({'lc:art:next-topic':{status:'concept'}}); const a={slug:'next-topic',titel:'Corrected text'};
  assert.equal((await bewaarArtikel(kv,a,[{slug:a.slug,status:'concept'}])).ok,true);
  assert.equal(kv.waarden.get('lc:arts').length,1); assert.equal(kv.waarden.get('lc:art:'+a.slug).titel,'Corrected text');
});
test('een mislukte leescontrole schrijft niets weg', async () => {
  const writes=[]; const kv={get:async()=>{throw Error('store unavailable');},set:async k=>writes.push(k)};
  await assert.rejects(bewaarArtikel(kv,{slug:'next-topic'},[]),/store unavailable/); assert.deepEqual(writes,[]);
});
