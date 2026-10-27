import {normalize} from './model.mjs';
export const sectors=[
 ['商社','#7959ad'],['食品','#bb8a24'],['飲食','#ce6c3b'],['スーパー','#43946b'],
 ['通信','#527dd1'],['コンビニ','#2e9b95'],['ドラッグストア','#bd6794'],['小売','#658752'],
 ['物流・宅配','#608a9f'],['鉄道','#4287a5'],['不動産','#9a7761'],['ホテル・旅館','#9e6686'],
 ['出版・書店','#867652'],['映画','#b96b72'],['ゲーム・玩具・娯楽施設','#8a6cb6'],['アパレル','#9b7c9e']
].map(([name,color],i)=>({name,color,index:i}));
const sectorNames=new Set(sectors.map(s=>s.name));
export const shortName=name=>name.replace(/株式会社|有限会社/g,'').replace(/ホールディングス/g,'HD').replace('東日本旅客鉄道','JR東日本').replace('西日本旅客鉄道','JR西日本').replace('東海旅客鉄道','JR東海').replace('九州旅客鉄道','JR九州').replace('北海道旅客鉄道','JR北海道').replace('四国旅客鉄道','JR四国').replace('エイチ・ツー・オー リテイリング','H2Oリテイリング').replace('パン・パシフィック・インターナショナルHD','PPIH').replace('ユナイテッド・スーパーマーケット・HD','U.S.M.H.').trim();
export function createGraph(atlas) {
 const byId=new Map(atlas.companies.map(c=>[c.id,c]));
 const children=id=>atlas.companies.filter(c=>c.parentIds.includes(id)&&['主要表示','展開時表示'].includes(c.display));
 function descendants(id,seen=new Set()) {if(seen.has(id))return []; const next=new Set([...seen,id]);return children(id).flatMap(c=>[c,...descendants(c.id,next)]);}
 function ancestors(id,seen=new Set()) {if(seen.has(id))return [];const next=new Set([...seen,id]);return (byId.get(id)?.parentIds||[]).flatMap(p=>byId.has(p)?[byId.get(p),...ancestors(p,next)]:[]);}
 function primary(c,seen=new Set()) {
  if(seen.has(c.id))return '小売';
  const business={'商社事業':'商社','鉄道事業':'鉄道','通信事業':'通信','不動産事業':'不動産','宿泊事業':'ホテル・旅館','映像事業':'映画','ゲーム・玩具事業':'ゲーム・玩具・娯楽施設','出版・書店事業':'出版・書店','物流事業':'物流・宅配'}[c.business];
  if(business&&c.industries.includes(business))return business;
  return c.industries.find(i=>sectorNames.has(i))||((c.parentIds||[]).map(id=>byId.get(id)).find(Boolean)?primary(byId.get(c.parentIds.find(id=>byId.has(id))),new Set([...seen,c.id])):'小売');
 }
 const eligible=atlas.companies.filter(c=>['主要表示','展開時表示'].includes(c.display));
 const edges=[];const keys=new Set();
 function edge(from,to,type){if(!byId.has(from)||!byId.has(to)||from===to)return;const key=type==='related'?[from,to].sort().join(':'):from+':'+to;if(keys.has(type+key))return;keys.add(type+key);edges.push({id:type+key,from,to,type,cross:primary(byId.get(from))!==primary(byId.get(to))});}
 for(const c of eligible) {for(const p of c.parentIds)edge(p,c.id,'parent');for(const p of c.relatedIds||[])edge(c.id,p,'related');}
 const base=new Set(eligible.filter(c=>c.display==='主要表示').map(c=>c.id));
 for(const e of edges)if(e.cross||e.type==='related'){base.add(e.from);base.add(e.to);for(const a of [...ancestors(e.from),...ancestors(e.to)])base.add(a.id);}
 function family(id) {const set=new Set([id,...ancestors(id).map(c=>c.id),...descendants(id).map(c=>c.id)]);for(const e of edges)if(e.type==='related'&&(e.from===id||e.to===id)){set.add(e.from);set.add(e.to);}return set;}
 function layout(expanded=new Set(),showBrands=false) {
  const visible=new Set(base);
  for(const id of expanded){visible.add(id);for(const c of [...ancestors(id),...descendants(id)])visible.add(c.id);}
  const nodes=eligible.filter(c=>visible.has(c.id)).map(c=>({...c,sector:primary(c),kind:'company',label:shortName(c.name)}));
  const links=edges.filter(e=>visible.has(e.from)&&visible.has(e.to));
  if(showBrands) {
   for(const b of atlas.brands){const operators=b.operatorIds.filter(id=>visible.has(id)&&expanded.has(id));const groups=b.groupIds.filter(id=>visible.has(id)&&expanded.has(id));const sources=operators.length?operators:groups;
    if(sources.length){const parent=byId.get(sources[0]);nodes.push({...b,sector:primary(parent),kind:'brand',label:b.name});for(const source of sources)links.push({id:'brand'+source+b.id,from:source,to:b.id,type:'brand',cross:false});}
   }
  }
  let y=65;const regions=[];
  for(let row=0;row<4;row++) {
   const cells=sectors.slice(row*4,row*4+4);let maxHeight=0;
   for(const sector of cells){const items=nodes.filter(n=>n.sector===sector.name).sort((a,b)=>(a.kind==='brand')-(b.kind==='brand')||(a.display!=='主要表示')-(b.display!=='主要表示')||a.name.localeCompare(b.name,'ja'));
    const height=Math.max(255,100+Math.ceil(items.length/2)*52);const x=45+(sector.index%4)*470;
    items.forEach((n,i)=>Object.assign(n,{x:x+20+(i%2)*218,y:y+84+Math.floor(i/2)*52,w:202,h:38,color:sector.color}));
    regions.push({...sector,x,y,w:450,h:height,count:items.filter(n=>n.kind==='company').length});maxHeight=Math.max(maxHeight,height);
   }
   y+=maxHeight+34;
  }
  return {nodes,links,regions,width:1930,height:y+20};
 }
 function search(query) {if(!normalize(query))return [];const needle=normalize(query);return [...eligible.map(c=>({...c,kind:'company'})),...atlas.brands.map(b=>({...b,kind:'brand'}))].filter(c=>normalize(c.name).includes(needle)).slice(0,12);}
 return {byId,children,descendants,ancestors,primary,edges,base,family,layout,search};
}
