// Offset-based edits preserve untouched text, CRLF and missing final newlines.
(function(scope){
 function parse(text){
  const lines=[...text.matchAll(/[^\n]*\n|[^\n]+$/g)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length}));
  const blocks=[];let current=null;
  for(const line of lines){
   const marker=line.text.replace(/\r?\n$/,'').match(/^([<|=>])\1{6,}(?: (.*))?$/);
   if(!marker)continue;
   const kind=marker[1],size=line.text.match(/^[<|=>]+/)[0].length;
   if(kind==='<'){
    if(current)throw Error('충돌 마커 구조를 확인하세요.');
    current={start:line.start,oursStart:line.end,size,leftLabel:marker[2]||'HEAD'};
   }else{
    if(!current||current.size!==size)throw Error('충돌 마커 구조를 확인하세요.');
    if(kind==='|'){
     if(current.baseStart!==undefined||current.theirsStart!==undefined)throw Error('충돌 마커 구조를 확인하세요.');
     current.oursEnd=line.start;current.baseStart=line.end;
    }else if(kind==='='){
     if(current.theirsStart!==undefined)throw Error('충돌 마커 구조를 확인하세요.');
     current.oursEnd??=line.start;current.baseEnd=line.start;current.theirsStart=line.end;
    }else{
     if(current.theirsStart===undefined)throw Error('충돌 마커 구조를 확인하세요.');
     blocks.push({start:current.start,end:line.end,ours:text.slice(current.oursStart,current.oursEnd),base:current.baseStart===undefined?null:text.slice(current.baseStart,current.baseEnd),theirs:text.slice(current.theirsStart,line.start),leftLabel:current.leftLabel,rightLabel:marker[2]||'MERGE_HEAD'});current=null;
    }
   }
  }
  if(current)throw Error('충돌 마커 구조를 확인하세요.');
  return blocks;
 }
 function resolve(text,index,choice){
  const block=parse(text)[index];if(!block||!['ours','theirs','both'].includes(choice))throw Error('충돌 선택이 유효하지 않습니다.');
  const content=choice==='both'?block.ours+block.theirs:block[choice];
  return text.slice(0,block.start)+content+text.slice(block.end);
 }
 function create(text){
  const parsed=parse(text),blocks=[];let content='',cursor=0;
  for(const [id,b] of parsed.entries()){content+=text.slice(cursor,b.start);const start=content.length;content+=b.base??b.ours;blocks.push({...b,id,start,end:content.length,resolved:false});cursor=b.end}
  content+=text.slice(cursor);return {content,blocks};
 }
 function replace(session,index,value,resolved=true){
  const block=session.blocks[index];if(!block)throw Error('충돌 선택이 유효하지 않습니다.');
  const delta=value.length-(block.end-block.start),end=block.start+value.length;
  return {content:session.content.slice(0,block.start)+value+session.content.slice(block.end),blocks:session.blocks.map((b,i)=>i===index?{...b,end,resolved}:i>index?{...b,start:b.start+delta,end:b.end+delta}:{...b})};
 }
 function choose(session,index,choice){const b=session.blocks[index];if(b?.manualOnly)throw Error('여러 충돌을 직접 편집했습니다. 결과를 확인하거나 되돌리세요.');if(!b||!['ours','theirs','both'].includes(choice))throw Error('충돌 선택이 유효하지 않습니다.');return replace(session,index,choice==='both'?b.ours+b.theirs:b[choice])}
 function edit(session,content){
  const old=session.content;let start=0;while(start<old.length&&start<content.length&&old[start]===content[start])start++;
  let end=old.length,next=content.length;while(end>start&&next>start&&old[end-1]===content[next-1]){end--;next--}
  const delta=content.length-old.length;const touched=session.blocks.filter(b=>!(b.end<=start&&b.start!==b.end)&&!(b.start>=end&&b.start!==b.end));
  return {content,blocks:session.blocks.map(b=>{
   if(b.end<=start&&b.start!==b.end)return {...b};if(b.start>=end&&b.start!==b.end)return {...b,start:b.start+delta,end:b.end+delta};
   return {...b,start:Math.min(b.start,start),end:Math.max(next,b.end+delta),resolved:false,manualOnly:b.manualOnly||touched.length>1};
  })};
 }
 scope.PgitConflict={parse,resolve,create,choose,edit};
})(globalThis);
