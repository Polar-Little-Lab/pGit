// Shared ancestors stay when any visible reference reaches them.
(function(root){
 function filterHistory(history,refs,hidden=[],solo=null,detachedHead=null){
  const byHash=new Map(history.map(commit=>[commit.hash,commit]));
  function ancestry(tips){
   const seen=new Set(),pending=[...tips];
   while(pending.length){const hash=pending.pop();if(seen.has(hash))continue;seen.add(hash);pending.push(...(byHash.get(hash)?.parents||[]))}
   return seen;
  }
  if(solo){const ref=refs.find(ref=>ref.name===solo);if(!ref)return history;const included=ancestry([ref.hash]);return history.filter(commit=>included.has(commit.hash))}
  if(!hidden.length)return history;
  const hiddenNames=new Set(hidden);
  const excluded=ancestry(refs.filter(ref=>hiddenNames.has(ref.name)).map(ref=>ref.hash));
  const included=ancestry([...refs.filter(ref=>!hiddenNames.has(ref.name)).map(ref=>ref.hash),...(detachedHead?[detachedHead]:[])]);
  return history.filter(commit=>!excluded.has(commit.hash)||included.has(commit.hash));
 }
 root.PgitHistoryModel={filterHistory};
})(globalThis);
