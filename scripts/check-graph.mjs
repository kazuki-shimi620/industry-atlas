import fs from 'node:fs';
import assert from 'node:assert/strict';
import{createGraph}from'../src/graph.mjs';
const atlas=JSON.parse(fs.readFileSync(new URL('../data/atlas.json',import.meta.url)));
const g=createGraph(atlas),l=g.layout();
const company=part=>atlas.companies.find(c=>c.name.includes(part));
const itochu=company('伊藤忠商事'),family=company('株式会社ファミリーマート'),lawson=atlas.companies.find(c=>c.name==='株式会社ローソン'),kddi=company('KDDI');
assert.ok(l.links.some(e=>e.from===itochu.id&&e.to===family.id&&e.cross&&e.type==='parent'),'ITOCHU to FamilyMart must cross industries');
assert.ok(l.links.some(e=>e.from===kddi.id&&e.to===lawson.id&&e.type==='related'),'KDDI and Lawson must remain a related edge');
assert.ok(!l.links.some(e=>e.from===kddi.id&&e.to===lawson.id&&e.type==='parent'),'Do not turn joint relations into a sole parent');
assert.equal(new Set(l.nodes.map(n=>n.id)).size,l.nodes.length);
for(const e of l.links) assert.ok(l.nodes.some(n=>n.id===e.from)&&l.nodes.some(n=>n.id===e.to));
for(let i=0;i<l.nodes.length;i++)for(let j=i+1;j<l.nodes.length;j++){
 const a=l.nodes[i],b=l.nodes[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`Overlapping nodes ${a.name}, ${b.name}`);
}
const zensho=company('ゼンショー');const expanded=g.layout(new Set([zensho.id]),true);for(const c of g.descendants(zensho.id))assert.ok(expanded.nodes.some(n=>n.id===c.id));
assert.ok(g.search('ファミリーマート').some(n=>n.id===family.id));
console.log(`Map verified: ${l.nodes.length} companies, ${l.links.length} links, ${l.links.filter(e=>e.cross).length} cross-industry links`);
