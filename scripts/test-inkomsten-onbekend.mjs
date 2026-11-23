import assert from 'node:assert/strict';
import { inkomsten, inkomstenHtml } from '../lib/inkomsten.js';
import {kv} from '../lib/db.js';
const realFetch=globalThis.fetch,oldToken=process.env.AWIN_TOKEN;process.env.AWIN_TOKEN='test-only';kv.get=async()=>({});
const day=new Date().toISOString().slice(0,10);
function response(value,ok=true,status=200){return {ok,status,json:async()=>value};}
const bol=response({ok:true,byDay:{[day]:{commission:12.5,orders:1}},total:{commission:12.5,orders:1}});
function mocks(awin){globalThis.fetch=async url=>String(url).includes('api.awin.com')?awin:bol;}
try{
 mocks(response([{transactionDate:day,commissionAmount:{amount:2.5},commissionStatus:'approved',advertiserId:1}]));
 let x=await inkomsten(3);assert.equal(x.compleet,true);assert.equal(x.vandaag,15);assert.equal(x.maand,15);assert.equal(x.perBron.awin.totaal,2.5);assert.equal(x.rijen[0].totaal,15);
 mocks(response(null,false,503));x=await inkomsten(3);assert.equal(x.compleet,false);assert.equal(x.vandaag,null);assert.equal(x.maand,null);assert.equal(x.bekend.maand,12.5);assert.equal(x.perBron.awin.totaal,null);assert.equal(x.rijen[0].awin,null);assert.equal(x.rijen[0].totaal,null);assert.equal(x.rijen[0].bol,12.5);
 const html=inkomstenHtml(x);assert.match(html,/Het totaal is onvolledig/);assert.match(html,/Onbekend/);assert.doesNotMatch(html,/<td class="n">€ 0,00<\/td>/);
 mocks(response({error:'wrong shape'}));x=await inkomsten(3);assert.equal(x.perBron.awin.ok,false);assert.equal(x.perBron.awin.totaal,null);
 globalThis.fetch=async()=>{throw new Error('offline');};x=await inkomsten(3);assert.equal(x.compleet,false);assert.equal(x.perBron.bol.totaal,null);assert.equal(x.perBron.awin.totaal,null);
 mocks(response([]));x=await inkomsten(3);assert.equal(x.compleet,true);assert.equal(x.perBron.awin.totaal,0);assert.equal(x.maand,12.5);
 console.log('Inkomsten: complete bron, ontbrekende bron, onleesbare bron, netwerkfout en echte nul gecontroleerd.');
}finally{globalThis.fetch=realFetch;if(oldToken===undefined)delete process.env.AWIN_TOKEN;else process.env.AWIN_TOKEN=oldToken;}

