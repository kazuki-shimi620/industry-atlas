export const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s/g,'');
export function createModel(atlas) {
  const companies = atlas.companies;
  const byId = new Map(companies.map(c => [c.id, c]));
  const children = id => companies.filter(c => c.parentIds.includes(id) && ['主要表示','展開時表示'].includes(c.display));
  function descendants(id, path = new Set()) {
    if (path.has(id)) return [];
    const next = new Set([...path, id]);
    return children(id).flatMap(c => [c, ...descendants(c.id, next)]);
  }
  const brandsFor = ids => atlas.brands.filter(b => [...b.groupIds,...b.operatorIds].some(id => ids.has(id)));
  function roots(industry, search = '') {
    const selected = companies.filter(c => c.display === '主要表示' && c.industries.includes(industry));
    const candidates = selected.filter(c => !selected.some(p => p.id !== c.id && descendants(p.id).some(d => d.id === c.id)));
    return candidates.filter(c => {
      const members = [c,...descendants(c.id)];
      return normalize([...members.map(m => m.name),...brandsFor(new Set(members.map(m => m.id))).map(b => b.name)].join(' ')).includes(normalize(search));
    });
  }
  return {byId, children, descendants, brandsFor, roots};
}
export function validateAtlas(atlas) {
  const errors = [], ids = new Set(atlas.companies.map(c => c.id));
  if(ids.size !== atlas.companies.length) errors.push('Duplicate company ID');
  const byId = new Map(atlas.companies.map(c => [c.id,c]));
  for(const c of atlas.companies) {
    for(const p of c.parentIds) if(!ids.has(p)) errors.push(`Missing parent: ${c.name}`);
    function walk(id, path) {
      if(path.has(id)) {errors.push(`Cycle: ${c.name}`);return;}
      for(const p of byId.get(id)?.parentIds || []) walk(p, new Set([...path,id]));
    }
    walk(c.id, new Set());
  }
  for(const b of atlas.brands) for(const id of [...b.groupIds,...b.operatorIds]) if(!ids.has(id)) errors.push(`Missing brand relation: ${b.name}`);
  return [...new Set(errors)];
}
