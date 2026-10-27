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
// Bounded token LCS: preserve unchanged words/punctuation, with a linear fallback for long lines.
function inlineChanges(before,after){
 const tokens=s=>s.match(/[\p{L}\p{N}_]+|\s+|[^\p{L}\p{N}_\s]/gu)||[];
 const a=tokens(before),b=tokens(after),left=[],right=[];
 const put=(out,text,changed)=>{if(!text)return;const last=out.at(-1);if(last&&last.changed===changed)last.text+=text;else out.push({text,changed})};
 if(a.length*b.length>65536){let start=0,end=0;while(start<a.length&&start<b.length&&a[start]===b[start])start++;while(end<a.length-start&&end<b.length-start&&a[a.length-1-end]===b[b.length-1-end])end++;for(const [input,out] of [[a,left],[b,right]]){put(out,input.slice(0,start).join(''),false);put(out,input.slice(start,input.length-end).join(''),true);put(out,input.slice(input.length-end).join(''),false)}return {before:left,after:right}}
 const width=b.length+1,dp=new Uint16Array((a.length+1)*width);
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i*width+j]=a[i]===b[j]?1+dp[(i+1)*width+j+1]:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);
 let i=0,j=0;while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){put(left,a[i++],false);put(right,b[j++],false)}else if(i<a.length&&(j===b.length||dp[(i+1)*width+j]>=dp[i*width+j+1]))put(left,a[i++],true);else put(right,b[j++],true)}return {before:left,after:right};
}
scope.PgitDiff={alignDiff,documentLines,changeBlocks,inlineChanges};
})(typeof window==='undefined'?globalThis:window);
