import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const bron = fs.readFileSync(new URL('../fn/mm.js',import.meta.url),'utf8');
const regel = bron.split('\n').find(x=>x.startsWith('const CM_JS = '));
const script = vm.runInNewContext(regel+'\nCM_JS',{MMU_JS:'',MM_JS:'window.meterGestart=true;',MMM_JS:'',RT_JS:'',PF_JS:'',WH_JS:'',WHL_JS:''});
test('WAM kan organische bezoekers meten; de bestaande standaard en uit-stand blijven behouden',()=>{
  for(const [meet,url,verwacht] of [['all','https://wearemany.now/',true],['','https://anders.example/',false],['','https://anders.example/?mmc=abc',true],['0','https://anders.example/?mmc=abc',false]]){
    const w={};new Function('window','document','location','URL',script)(w,{currentScript:{getAttribute:n=>n==='data-meet'?meet:null}},{href:url},URL);assert.equal(!!w.meterGestart,verwacht);
  }
});
