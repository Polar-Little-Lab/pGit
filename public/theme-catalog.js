// Every palette supplies the same semantic colors, including controls and previews.
(()=>{
 const names=['canvas','surface','soft','text','muted','border','accent','accentHover','selected','primary'];
 const definitions=[
  ['light','Frost','light',['#f5f6f7','#ffffff','#edf0f2','#252b32','#626b76','#dce1e5','#32678c','#285573','#e5eef4','#32678c']],
  ['glacier','Glacier','light',['#edf7f5','#ffffff','#dceee9','#203c38','#506e67','#b8d6cc','#226d5d','#195648','#cbe8de','#226d5d']],
  ['snow','Snow','light',['#f4f5f7','#ffffff','#e8eaf0','#292e3d','#606778','#cbd0db','#535ba1','#414882','#e3e5f7','#535ba1']],
  ['dark','Polar Night','dark',['#1a1e24','#22272e','#2b323b','#e5e9ee','#a4aebc','#3b444f','#96cce9','#b5def3','#304657','#356a8b']],
  ['aurora','Aurora','dark',['#211c30','#2b243d','#382e4b','#eee5f7','#bcb0ce','#544365','#c6aff1','#ddcafa','#4d3c69','#72519d']],
  ['midnight','Midnight','dark',['#181b20','#23272e','#2e333c','#e7eaf0','#a8b0be','#474f5d','#aabef5','#cad7ff','#3c4965','#4c6399']],
 ];
 window.PgitThemes=definitions.map(([id,name,appearance,colors])=>({id,name,appearance,colors:Object.fromEntries(names.map((key,index)=>[key,colors[index]]))}));
})();
