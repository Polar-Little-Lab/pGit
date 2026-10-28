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
 scope.PgitConflict={parse,resolve};
})(globalThis);
