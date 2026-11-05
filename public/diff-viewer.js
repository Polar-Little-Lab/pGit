// Shared code comparison, with optional selection controls for working-tree staging.
function renderCodeDiff(content,data,selection=null){
 content.querySelectorAll('.diff-scroll').forEach(p=>p.dispatchEvent(new Event('pgit-dispose')));content.replaceChildren();content.classList.add('idea-diff');
 let ROW=22;let view='split',wordHighlight=true,ignoreWhitespace=false,fold=false,expanded=new Set(),rows=[],blocks=[],blockIndex=-1,panes=[],drawers=[],connector=null,unifiedOffsets=[];
 const baseRows=data.nonText?[]:PgitDiff.alignDiff(data.before,data.after,data.patch),syntax={before:PgitCode.syntaxLines(data.before.content,data.file.oldName),after:PgitCode.syntaxLines(data.after.content,data.file.name)};
 const bar=el('div',undefined,'diff-controls');const file=el('strong',data.file.name);file.title=data.file.name;bar.append(file);
 const prev=compareButton('이전 변경',()=>jump(-1),'diff-icon'),next=compareButton('다음 변경',()=>jump(1),'diff-icon');PgitIcons.label(prev,'up');prev.setAttribute('aria-label','이전 변경');PgitIcons.label(next,'down');next.setAttribute('aria-label','다음 변경');prev.dataset.tooltip='이전 변경으로 이동 · Alt+↑';next.dataset.tooltip='다음 변경으로 이동 · Alt+↓';
 const viewControl=PgitUI.segments({items:[['split','좌우 보기'],['unified','통합 보기']],value:view,label:'비교 보기 방식',className:'ui-segmented',onChange:next=>{view=next;drawView()}});
 const viewMode=viewControl.element,split=viewControl.buttons.get('split'),unified=viewControl.buttons.get('unified');split.dataset.tooltip='변경 전후를 좌우로 나란히 비교합니다.';unified.dataset.tooltip='삭제된 줄과 추가된 줄을 한 화면에서 비교합니다.';
 const whitespaceControl=PgitUI.segments({items:[['include','공백 포함'],['ignore','줄 내 공백 무시']],value:'include',label:'공백 비교 방식',className:'whitespace-buttons ui-segmented',onChange:next=>{const ignore=next==='ignore';if(ignoreWhitespace===ignore)return;ignoreWhitespace=ignore;staging?.chosen.clear();expanded.clear();blockIndex=-1;drawView();syncSelection()}});
 const whitespace=whitespaceControl.element;whitespaceControl.buttons.get('include').dataset.tooltip='공백과 탭의 차이도 변경으로 표시합니다.';whitespaceControl.buttons.get('ignore').dataset.tooltip='공백·탭만 달라진 줄은 강조하지 않습니다. 파일 내용은 바뀌지 않습니다.';
 const words=compareButton('바뀐 부분 강조',()=>{wordHighlight=!wordHighlight;words.setAttribute('aria-pressed',String(wordHighlight));drawers.forEach(draw=>draw())});words.setAttribute('aria-pressed','true');
 const folding=compareButton('변경 없는 줄 접기',()=>{fold=!fold;folding.setAttribute('aria-pressed',String(fold));drawView()});folding.setAttribute('aria-pressed','false');
 words.dataset.tooltip='수정된 줄에서 달라진 글자·단어만 더 진하게 표시합니다.';folding.dataset.tooltip='변경 없는 긴 구간을 접고 변경 앞뒤 3줄을 남깁니다. 접힌 줄 수를 누르면 다시 펼칩니다.';
 let syncEnabled=true;const sync=compareButton('스크롤 동기화',()=>{syncEnabled=!syncEnabled;sync.setAttribute('aria-pressed',String(syncEnabled));if(syncEnabled&&panes.length===2){panes[1].scrollTop=panes[0].scrollTop;panes[1].scrollLeft=panes[0].scrollLeft}});sync.setAttribute('aria-pressed','true');sync.dataset.tooltip='좌우 코드의 스크롤 위치를 함께 이동합니다.';
 for(const button of [words,folding,sync])button.classList.add('ui-toggle');
 const count=el('span',undefined,'diff-count');count.setAttribute('role','status');bar.append(prev,next,viewMode,whitespace,words,folding,sync,count);content.append(bar);
 let staging=null;
 if(selection?.hunks&&!data.nonText){
  try{staging=createDiffSelection(data,baseRows,selection)}catch(error){content.append(el('p',error.message,'inline-stage-note'))}
 }
 if(staging){
  const tools=el('div',undefined,'inline-stage-toolbar'),all=PgitUI.checkboxField('전체 변경 선택'),summary=el('span'),run=compareButton(selection.staged?'선택한 변경 스테이징 해제':'선택한 변경 스테이징',async()=>{if(working)return;run.disabled=true;content.inert=true;try{await selection.apply(staging.payload())}finally{if(content.isConnected){content.inert=false;syncSelection()}}},'primary');summary.setAttribute('role','status');tools.append(all.element,summary,run);content.append(tools);
  staging.controls={all:all.input,summary,run};all.input.onchange=()=>{staging.keys.forEach(key=>all.input.checked?staging.chosen.add(key):staging.chosen.delete(key));syncSelection()};syncSelection();
 }else if(selection?.unavailable)content.append(el('p',selection.unavailable,'inline-stage-note'));
 function syncSelection(){if(!staging||!staging.controls.run.isConnected)return;const {chosen,keys,controls}=staging;controls.all.checked=chosen.size===keys.length;controls.all.indeterminate=chosen.size>0&&chosen.size<keys.length;controls.all.disabled=ignoreWhitespace;controls.summary.textContent=ignoreWhitespace?'줄 선택은 공백 포함 보기에서 할 수 있습니다.':chosen.size+'개 변경 줄 선택';controls.run.disabled=ignoreWhitespace||!chosen.size;
  content.querySelectorAll('input[data-diff-selection]').forEach(input=>{const values=input.dataset.diffSelection.split(',');const count=values.filter(k=>chosen.has(k)).length;input.checked=count===values.length;input.indeterminate=count>0&&count<values.length});content.querySelectorAll('.diff-code-row').forEach(line=>line.classList.toggle('is-stage-selected',!!line.dataset.selectionKey&&chosen.has(line.dataset.selectionKey)));
 }
 function selectionGutter(line,row,side,firstBlock){if(!staging||ignoreWhitespace)return;const rail=el('span',undefined,'inline-stage-gutter'),key=staging.byLine.get(side+':'+(side==='before'?row.oldLine:row.newLine));
  function check(values,label,cls){const input=el('input');input.type='checkbox';input.className=cls;input.dataset.diffSelection=values.join(',');input.setAttribute('aria-label',label);input.title=label;input.checked=values.every(k=>staging.chosen.has(k));input.indeterminate=!input.checked&&values.some(k=>staging.chosen.has(k));input.onchange=()=>{values.forEach(k=>input.checked?staging.chosen.add(k):staging.chosen.delete(k));syncSelection()};return input}
  if(firstBlock){const values=staging.groups.get(row.sourceIndex);if(values?.length)rail.append(check(values,'변경 블록 선택','inline-block-check'))}else rail.append(el('span',undefined,'inline-block-spacer'));
  if(key){rail.append(check([key],(side==='before'?'삭제':'추가')+' '+(side==='before'?row.oldLine:row.newLine)+'번 줄 선택','inline-line-check'));line.dataset.selectionKey=key;line.classList.toggle('is-stage-selected',staging.chosen.has(key))}line.prepend(rail);
 }
 const display=el('div',undefined,'diff-display');content.append(display);
 if(data.nonText){for(const button of [prev,next,split,unified,words,folding,sync,...whitespaceControl.buttons.values()])button.disabled=true;const grid=el('div',undefined,'diff-special');for(const [label,value] of [['Before',data.before],['After',data.after]]){const side=el('section');side.append(el('h4',label),el('p',value.kind==='absent'?'이쪽에는 파일이 없습니다.':value.kind==='large'?'1MB 또는 20,000줄을 초과하여 미리보기를 생략합니다.':value.kind==='binary'?'바이너리 또는 UTF-8이 아닌 파일입니다.':value.content),el('small',value.bytes+' bytes'));grid.append(side)}display.append(grid);return}
 function refreshCount(){count.textContent=blockIndex<0?`${blocks.length}개 변경`:`${blockIndex+1} / ${blocks.length} 변경`;prev.disabled=next.disabled=!blocks.length}
 function navigate(index){if(!blocks.length)return;blockIndex=(index+blocks.length)%blocks.length;for(const pane of panes)pane.scrollTop=Math.max(0,((view==='unified'?unifiedOffsets[blockIndex]:blocks[blockIndex])-3)*ROW);refreshCount();drawers.forEach(draw=>draw());drawConnectors()}
 function jump(direction){navigate(blockIndex<0?(direction>0?0:blocks.length-1):blockIndex+direction)}
 content.onkeydown=e=>{if(e.altKey&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();jump(e.key==='ArrowUp'?-1:1)}};
 function paint(code,row,side){const text=row[side]??'',number=side==='before'?row.oldLine:row.newLine;const tokens=syntax[side][number-1]||[{text,kind:''}];let parts=[{text,changed:false}];if(wordHighlight&&row.kind==='change'){row.inline??=PgitDiff.inlineChanges(row.before,row.after);parts=row.inline[side]}
  let tokenIndex=0,tokenOffset=0;for(const part of parts){const target=part.changed?el('mark',undefined,'diff-word'):document.createDocumentFragment();let remaining=part.text.length;while(remaining>0){const token=tokens[tokenIndex];if(!token){target.append(document.createTextNode(part.text.slice(part.text.length-remaining)));break}const size=Math.min(remaining,token.text.length-tokenOffset),chunk=token.text.slice(tokenOffset,tokenOffset+size);target.append(token.kind?el('span',chunk,'syntax-'+token.kind):document.createTextNode(chunk));remaining-=size;tokenOffset+=size;if(tokenOffset===token.text.length){tokenIndex++;tokenOffset=0}}code.append(target)}
 }
 function drawConnectors(){
  if(!connector||panes.length!==2)return;
  const height=panes[0].clientHeight;
  connector.setAttribute('viewBox',`0 0 24 ${Math.max(1,height)}`);connector.replaceChildren();
  for(const start of blocks){
   let end=start+1;while(end<rows.length&&rows[end].kind!=='context'&&rows[end].kind!=='fold')end++;
   const extent=side=>{let first=-1,last=-1;for(let i=start;i<end;i++)if(rows[i][side]!==null){if(first<0)first=i;last=i}return first<0?[start,start,false]:[first,last+1,true]};
   const left=extent('before'),right=extent('after');
   const a=left[0]*ROW-panes[0].scrollTop,b=left[1]*ROW-panes[0].scrollTop,c=right[0]*ROW-panes[1].scrollTop,d=right[1]*ROW-panes[1].scrollTop;
   if(Math.max(b,d)<0||Math.min(a,c)>height)continue;
   const path=document.createElementNS('http://www.w3.org/2000/svg','path');
   // Horizontal tangents join the actual colored blocks; alignment blanks are excluded.
   path.setAttribute('d',`M0 ${a} C12 ${a} 12 ${c} 24 ${c} L24 ${d} C12 ${d} 12 ${b} 0 ${b} Z`);
   path.setAttribute('class',!left[2]?'bridge-add':!right[2]?'bridge-delete':'bridge-change');connector.append(path);
  }
 }
 function drawUnified(oldTop){
  const model=PgitDiff.unifiedRows(rows),entries=model.entries;unifiedOffsets=model.offsets;
  const container=el('section',undefined,'unified-comparison');
  const legend=el('div',undefined,'unified-legend');legend.append(el('span','− 삭제된 줄','legend-delete'),el('span','+ 추가된 줄','legend-add'),el('span','번호: 변경 전 / 변경 후','legend-numbers'));container.append(legend);
  const viewport=el('div',undefined,'diff-viewport');const scroll=el('div',undefined,'diff-scroll unified-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label','통합 코드 비교');
  const canvas=el('div',undefined,'diff-canvas');canvas.style.height=Math.max(1,entries.length)*ROW+'px';const maxChars=entries.reduce((max,entry)=>Math.max(max,(entry.row[entry.side]||'').replace(/\t/g,'    ').length),0);canvas.style.minWidth=Math.min(200000,130+maxChars*(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--code-font-size'))||12)*0.7)+'px';scroll.append(canvas);
  const overview=el('div',undefined,'diff-overview');overview.setAttribute('aria-label','변경 위치');unifiedOffsets.forEach((start,index)=>{const marker=compareButton('',()=>navigate(index),'overview-marker marker-change');marker.style.top=start/Math.max(1,entries.length)*100+'%';marker.setAttribute('aria-label',`변경 ${index+1}로 이동`);overview.append(marker)});
  const draw=()=>{const start=Math.max(0,Math.floor(scroll.scrollTop/ROW)-12),end=Math.min(entries.length,start+Math.ceil(scroll.clientHeight/ROW)+24);canvas.replaceChildren();for(let i=start;i<end;i++){const {row,kind,side,block}=entries[i];if(kind==='fold'){const button=compareButton(`변경 없는 ${row.count}줄 펼치기`,()=>{expanded.add(row.start);drawView()},'diff-fold');button.style.top=i*ROW+'px';canvas.append(button);continue}
    const line=el('div',undefined,'diff-code-row unified-row '+(kind==='delete'?'diff-removed':kind==='add'?'diff-added':'')+(block===blockIndex?' current-difference':''));line.style.top=i*ROW+'px';line.dataset.kind=kind;line.setAttribute('role','group');line.setAttribute('aria-label',kind==='delete'?'삭제된 줄':kind==='add'?'추가된 줄':'변경 없는 줄');
    const gutter=el('span',undefined,'unified-gutter');gutter.setAttribute('aria-hidden','true');gutter.append(el('span',kind==='add'?'':String(row.oldLine??''),'old-line'),el('span',kind==='delete'?'':String(row.newLine??''),'new-line'),el('span',kind==='delete'?'−':kind==='add'?'+':'','line-sign'));
    const code=el('code');paint(code,row,side);line.append(gutter,code);selectionGutter(line,row,side,i===0||entries[i-1].block!==block);canvas.append(line);
   }};
  scroll.onscroll=draw;viewport.append(scroll,overview);container.append(viewport);display.append(container);panes=[scroll];drawers=[draw];requestAnimationFrame(()=>{if(scroll.isConnected){scroll.scrollTop=blockIndex>=0?Math.max(0,(unifiedOffsets[blockIndex]-3)*ROW):oldTop;draw()}});
  const observer=new ResizeObserver(draw);observer.observe(scroll);scroll.addEventListener('pgit-dispose',()=>observer.disconnect(),{once:true});
 }
 function drawView(){ROW=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--code-row-height'))||22;const oldTop=panes[0]?.scrollTop||0;display.querySelectorAll('.diff-scroll').forEach(p=>p.dispatchEvent(new Event('pgit-dispose')));display.replaceChildren();panes=[];drawers=[];connector=null;rows=PgitCode.foldRows(PgitCode.filteredRows(baseRows,ignoreWhitespace),fold,expanded);blocks=rows.reduce((out,row,i)=>{if(row.kind!=='context'&&row.kind!=='fold'&&(i===0||['context','fold'].includes(rows[i-1].kind)))out.push(i);return out},[]);if(blockIndex>=blocks.length)blockIndex=-1;
  viewControl.setValue(view);sync.disabled=view!=='split';refreshCount();
  if(view==='unified'){drawUnified(oldTop);return}
  const grid=el('div',undefined,'split-comparison');
  for(const [side,label,hash,name,blob] of [['before',data.working?(data.from==='HEAD'?'HEAD':'인덱스'):'Before · 커밋 이전',data.from,data.file.oldName,data.before],['after',data.working?(data.to==='INDEX'?'인덱스':'작업 폴더'):'After · 커밋 이후',data.to,data.file.name,data.after]]){
   const column=el('section',undefined,'diff-column '+side);const header=el('div',undefined,'diff-column-header');header.append(PgitIcons.icon('lock'),el('code',hash?hash.slice(0,10):'없음'),el('strong',label),el('span',name,'literal-data diff-header-path'));header.title=name;
   const viewport=el('div',undefined,'diff-viewport'),scroll=el('div',undefined,'diff-scroll');scroll.tabIndex=0;scroll.setAttribute('aria-label',label+' 코드');const canvas=el('div',undefined,'diff-canvas');canvas.style.height=Math.max(1,rows.length)*ROW+'px';const maxChars=rows.reduce((max,row)=>Math.max(max,(row[side]||'').replace(/\t/g,'    ').length),0);canvas.style.minWidth=Math.min(200000,80+maxChars*(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--code-font-size'))||12)*0.7)+'px';scroll.append(canvas);
   const overview=el('div',undefined,'diff-overview');overview.setAttribute('aria-label','변경 위치');blocks.forEach((start,index)=>{const marker=compareButton('',()=>navigate(index),'overview-marker marker-'+rows[start].kind);marker.style.top=(start/Math.max(1,rows.length))*100+'%';marker.setAttribute('aria-label',`변경 ${index+1}로 이동`);marker.title=`${index+1} / ${blocks.length}`;overview.append(marker)});
   const draw=()=>{const start=Math.max(0,Math.floor(scroll.scrollTop/ROW)-12),end=Math.min(rows.length,start+Math.ceil(scroll.clientHeight/ROW)+24);canvas.replaceChildren();for(let i=start;i<end;i++){const row=rows[i];if(row.kind==='fold'){const button=compareButton(`변경 없는 ${row.count}줄 펼치기`,()=>{expanded.add(row.start);drawView()},'diff-fold');button.style.top=i*ROW+'px';canvas.append(button);continue}const text=row[side],number=side==='before'?row.oldLine:row.newLine;const changed=row.kind!=='context';const line=el('div',undefined,'diff-code-row '+(text===null?'diff-gap':!changed?'':side==='before'?'diff-removed':'diff-added')+(row.kind==='change'?' diff-modified':''));line.style.top=i*ROW+'px';line.dataset.row=i;line.dataset.kind=row.kind;if(blockIndex>=0&&i>=blocks[blockIndex]&&i<(blocks[blockIndex+1]??rows.length)&&changed)line.classList.add('current-difference');const lineNo=el('span',number===null?'':String(number),'diff-line-number');lineNo.setAttribute('aria-hidden','true');lineNo.dataset.change=!changed?'':row.kind==='change'?'↔':text===null?'':side==='before'?'−':'+';const code=el('code');paint(code,row,side);line.append(lineNo,code);selectionGutter(line,row,side,side==='after'&&staging?.groups.has(row.sourceIndex));canvas.append(line)}drawConnectors()};
   scroll.onscroll=()=>{draw();if(syncEnabled)for(const other of panes)if(other!==scroll){if(Math.abs(other.scrollTop-scroll.scrollTop)>1)other.scrollTop=scroll.scrollTop;if(Math.abs(other.scrollLeft-scroll.scrollLeft)>1)other.scrollLeft=scroll.scrollLeft}};viewport.append(scroll,overview);column.append(header,viewport);const note=blob.kind==='absent'?(side==='before'?'새 파일 · 이전 내용 없음':'파일 삭제 · 이후 내용 없음'):blob.noNewline?'파일 끝에 줄바꿈 없음':blob.kind==='symlink'?'심볼릭 링크 대상 경로':'\u00a0';column.append(el('div',note,'diff-file-note'));grid.append(column);panes.push(scroll);drawers.push(draw);requestAnimationFrame(()=>{if(scroll.isConnected){scroll.scrollTop=blockIndex>=0?Math.max(0,(blocks[blockIndex]-3)*ROW):oldTop;draw()}});const observer=new ResizeObserver(draw);observer.observe(scroll);scroll.addEventListener('pgit-dispose',()=>observer.disconnect(),{once:true});
   if(side==='before'){const bridge=el('div',undefined,'diff-bridge');connector=document.createElementNS('http://www.w3.org/2000/svg','svg');connector.setAttribute('aria-hidden','true');connector.setAttribute('preserveAspectRatio','none');bridge.append(connector);grid.append(bridge)}
  }
  display.append(grid);requestAnimationFrame(drawConnectors);
 }
 content.pgitTypographyRefresh=drawView;drawView();
}

// Working-tree/index previews supply revision-checked partial staging controls.
function installWorkingDiff(){
 const old=$('diff'),host=el('div');host.id='diff';host.setAttribute('aria-describedby','diffAreaHint');old.replaceWith(host);const workingBar=$('filename').parentElement;PgitIcons.label(switchView,'back');switchView.setAttribute('aria-label','그래프 보기');switchView.title='그래프 보기';workingBar.prepend(switchView);workingBar.append(fileActions);fileActions.querySelector('[data-file-action=diffSides]').hidden=true;fileActions.querySelector('[data-file-action=hunks]').hidden=true;
 function disposeWorking(){host.pgitSelection=null;host.querySelectorAll('.diff-scroll').forEach(p=>p.dispatchEvent(new Event('pgit-dispose')));host.replaceChildren();++diffRequest}
 loadDiff=async function(){syncDiffControls();if(workingReview.hidden)return;const request=++diffRequest;host.querySelectorAll('.diff-scroll').forEach(p=>p.dispatchEvent(new Event('pgit-dispose')));host.replaceChildren();if(!selected){$('filename').textContent='파일을 선택하세요';return}const name=selected,area=staged;$('filename').replaceChildren(el('span',name,'literal-data'),el('span',area?' · 커밋할 변경':' · 작업 폴더'));host.append(el('div','파일 내용을 불러오는 중…','compare-empty'));try{const [data,patch]=await Promise.all([api('workingComparison',{name,staged:area}),api('hunks',{name,staged:area}).catch(error=>({unavailable:error.message}))]);if(request!==diffRequest||workingReview.hidden)return;const key=JSON.stringify([state.root,name,area,patch.revision]);if(host.pgitSelection?.key!==key)host.pgitSelection={key,chosen:new Set()};renderCodeDiff(host,data,{...patch,chosen:host.pgitSelection.chosen,staged:area,apply:async selections=>{await mutate('stageSelection',{name,staged:area,revision:patch.revision,selections});await loadDiff()}})}catch(error){if(request===diffRequest)host.replaceChildren(el('div',error.message,'compare-empty'))}};
 const editorTab=tab;tab=function(value){editorTab(value);if(workingReview.hidden)disposeWorking();else loadDiff()};
 const editorGraphHome=graphHome;graphHome=function(){editorGraphHome();disposeWorking()};
}

// Match patch line identities to displayed rows; never stage a mismatched preview.
function createDiffSelection(data,rows,patch){
 const byLine=new Map(),records=new Map(),chosen=patch.chosen||new Set(),groups=new Map();
 const texts={before:PgitDiff.documentLines(data.before.content),after:PgitDiff.documentLines(data.after.content)};
 for(const h of patch.hunks){const lines=h.text.split('\n'),range=lines.shift().match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);if(!range)throw Error('Diff를 다시 불러와 주세요.');let old=Number(range[1]),next=Number(range[2]);
  lines.forEach((line,index)=>{const type=line[0];if(type==='-'||type==='+'){const side=type==='-'?'before':'after',number=type==='-'?old:next,key=h.index+':'+index;if(texts[side][number-1]!==line.slice(1))throw Error('파일이 변경되었습니다. 다시 선택해 주세요.');byLine.set(side+':'+number,key);records.set(key,{index:h.index,line:index})}if(type===' '||type==='-')old++;if(type===' '||type==='+')next++});
 }
 let active=null,count=0;for(const [rowIndex,row] of rows.entries()){if(row.kind==='context'){active=null;continue}if(!active){active=[];groups.set(rowIndex,active)}for(const side of ['before','after'])if(row[side]!==null){const key=byLine.get(side+':'+(side==='before'?row.oldLine:row.newLine));if(!key)throw Error('파일이 변경되었습니다. 다시 선택해 주세요.');active.push(key);count++}}
 if(count!==records.size)throw Error('파일이 변경되었습니다. 다시 선택해 주세요.');
 return {byLine,groups,chosen,keys:[...records.keys()],payload(){const selected=new Map();for(const key of chosen){const r=records.get(key);if(!selected.has(r.index))selected.set(r.index,[]);selected.get(r.index).push(r.line)}return [...selected].map(([index,lines])=>({index,lines}))}};
}
