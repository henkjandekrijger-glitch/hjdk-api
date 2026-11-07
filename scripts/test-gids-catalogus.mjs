import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogusItems,catalogusInhoud} from '../lib/gids-catalogus.js';
const options={rubriek:c=>({id:c||'overig',naam:c||'Overig'}),soort:s=>s||'Overig',prijs:()=> '€20,00',bezorgdag:()=> 'Niet opgegeven',koopcheck:()=> ''};
test('compleet aanbod bewaart oude en c2b-producten; geen dubbele of uitverkochte regels',()=>{
 const items=[{id:'oc_1',t:'Oud product',c:'keuken',l:1},{id:'c2b_2',t:'Ander product',c:'wonen'},{id:'oc_1',t:'Oud product bijgewerkt',c:'keuken'},{id:'oc_3',t:'Uitverkocht',vr:false}];
 assert.equal(catalogusItems(items).length,2);const r=catalogusInhoud(items,options);assert.equal((r.html.match(/<tr id="product-/g)||[]).length,2);assert.ok(r.html.includes('/naar/c2b_2'));assert.ok(r.html.includes('Oud product bijgewerkt'));assert.ok(!r.html.includes('Uitverkocht'));assert.deepEqual(r.lijst.map(i=>i.id),[...r.html.matchAll(/<tr id="product-([^"]+)/g)].map(m=>m[1]));assert.ok(r.html.includes('Nog geen externe koopcheck'));
});
test('inhoud blijft compleet boven 2000 items en HTML ontsnapt invoer',()=>{
 const list=Array.from({length:4081},(_,n)=>({id:'oc_'+n,t:n===0?'<script>voorbeeld</script>':'Product '+n,c:'keuken'}));
 const r=catalogusInhoud(list,options);assert.equal(r.lijst.length,4081);assert.equal((r.html.match(/<tr id="product-/g)||[]).length,4081);assert.ok(r.html.includes('&lt;script&gt;'));assert.ok(!r.html.includes('<script>voorbeeld'));
 assert.ok(Buffer.byteLength(r.html)<4_000_000);
});
