(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PgitGroups=factory()})(globalThis,()=>{
 const colors={blue:'#4087c7',orange:'#cb7a24',teal:'#279985',purple:'#9970c9',rose:'#ce6684',slate:'#7e8da0'};
 const catalog=typeof module==='object'&&module.exports?require('./group-icon-catalog.cjs'):globalThis.PgitGroupCatalog;
 const legacyIcons=new Set(['hana-financial','hana-ti','hana-life','hana-insurance','hana-savings','hana-securities','hana-card','hana-capital']);
 const icons=['folder','cloud','code','worktree','branch','lock','briefcase','user','server','database','flask','mobile','palette',...catalog.map(x=>x.id)];
 function normalize(value={}){
  const groups=[];for(const g of Array.isArray(value.groups)?value.groups:[]){if(groups.length>=30)break;if(!g||typeof g.id!=='string'||!g.id||g.id.length>80||groups.some(x=>x.id===g.id)||typeof g.name!=='string'||!g.name.trim())continue;groups.push({id:g.id,name:g.name.trim().slice(0,40),color:Object.hasOwn(colors,g.color)?g.color:'blue',icon:legacyIcons.has(g.icon)?'hana-bank':icons.includes(g.icon)?g.icon:'folder'})}
  const projectGroups=Object.create(null);for(const [p,id] of Object.entries(value.projectGroups||{}).slice(0,1000))if(typeof p==='string'&&p.length<=4096&&!/[\0\r\n]/.test(p)&&(/^(\/|[a-z]:[\\/]|\\\\)/i.test(p))&&groups.some(g=>g.id===id))projectGroups[p]=id;
  return {groups,projectGroups};
 }
 const brands=new Map(catalog.map(x=>[x.id,x]));
 function color(group){return brands.get(group.icon)?.brandColor||colors[group.color]||colors.blue}
 function isBrand(icon){return brands.has(icon)}
 return {colors,icons,normalize,color,isBrand};
});
