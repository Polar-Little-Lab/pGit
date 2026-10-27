// Align complete before/after documents using Git's hunk coordinates, without quadratic LCS.
(function(scope){
function documentLines(text){if(text==='')return [];const lines=text.split('\n');if(lines.at(-1)==='')lines.pop();return lines}
function alignDiff(before,after,patch){const left=documentLines(before.content),right=documentLines(after.content),rows=[];let a=0,b=0;
 const append=(oldText,newText,kind)=>{rows.push({before:oldText,after:newText,oldLine:oldText===null?null:++a,newLine:newText===null?null:++b,kind})};
 if(before.kind==='absent'){right.forEach(s=>append(null,s,'add'));return rows}if(after.kind==='absent'){left.forEach(s=>append(s,null,'delete'));return rows}
 const lines=patch.split('\n');let pendingOld=[],pendingNew=[];
 function flush(){for(let i=0;i<Math.max(pendingOld.length,pendingNew.length);i++)append(pendingOld[i]??null,pendingNew[i]??null,pendingOld[i]!==undefined&&pendingNew[i]!==undefined?'change':pendingOld[i]!==undefined?'delete':'add');pendingOld=[];pendingNew=[]}
 let inHunk=false;
 for(const line of lines){const match=line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(match){flush();const oldStart=Number(match[1])-(match[2]==='0'?0:1),newStart=Number(match[3])-(match[4]==='0'?0:1);while(a<oldStart||b<newStart)append(a<oldStart?left[a]:null,b<newStart?right[b]:null,'context');inHunk=true;continue}if(!inHunk)continue;if(line.startsWith('-'))pendingOld.push(line.slice(1));else if(line.startsWith('+'))pendingNew.push(line.slice(1));else if(line.startsWith(' ')){flush();append(line.slice(1),line.slice(1),'context')}}flush();while(a<left.length||b<right.length)append(a<left.length?left[a]:null,b<right.length?right[b]:null,'context');
 // Never show a misleading alignment if Git's patch does not match the blob contents.
 if(a!==left.length||b!==right.length||rows.filter(r=>r.before!==null).some((r,i)=>r.before!==left[i])||rows.filter(r=>r.after!==null).some((r,i)=>r.after!==right[i]))throw Error('Diff 정렬이 파일 내용과 일치하지 않습니다.');return rows;
}
function changeBlocks(rows){const blocks=[];for(let i=0;i<rows.length;i++)if(rows[i].kind!=='context'&&(i===0||rows[i-1].kind==='context'))blocks.push(i);return blocks}
scope.PgitDiff={alignDiff,documentLines,changeBlocks};
})(typeof window==='undefined'?globalThis:window);
