import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createModel,validateAtlas} from '../src/model.mjs';
const atlas=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url)));
assert.ok(atlas.companies.length>0,'No companies');
assert.deepEqual(validateAtlas(atlas),[]);
const model=createModel(atlas);
for(const industry of new Set(atlas.companies.flatMap(c=>c.industries))) {
 const roots=model.roots(industry);
 console.log(`${industry}: ${roots.length} groups`);
 for(const root of roots) {
   for(const child of model.descendants(root.id)) assert.ok(model.roots(industry,child.name).some(r=>r.id===root.id),`Unsearchable child ${child.name}`);
 }
}
const fixture={companies:[{id:'a',name:'Parent',display:'主要表示',industries:['x'],parentIds:[]},{id:'b',name:'Middle',display:'展開時表示',industries:[],parentIds:['a']},{id:'c',name:'Child',display:'展開時表示',industries:[],parentIds:['b']}],brands:[{id:'d',name:'Hidden Brand',groupIds:[],operatorIds:['c']}]};
assert.equal(createModel(fixture).roots('x','hidden brand')[0].id,'a');
fixture.companies[0].parentIds=['c'];
assert.ok(validateAtlas(fixture).some(e=>e.startsWith('Cycle')));
console.log(`Validated ${atlas.companies.length} companies and ${atlas.brands.length} brands`);
