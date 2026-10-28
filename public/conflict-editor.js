function mountConflictChoices(body,editor,save){
 const controls=el('div',undefined,'conflict-tools'),count=el('strong'),undo=el('button','선택 되돌리기');undo.type='button';controls.append(count,undo);
 const list=el('div',undefined,'conflict-blocks'),resultLabel=el('label','최종 결과');resultLabel.htmlFor='conflictResult';editor.id='conflictResult';
 body.prepend(controls,list,resultLabel);let snapshots=[];
 function draw(){
  list.replaceChildren();undo.disabled=!snapshots.length;
  let blocks;try{blocks=PgitConflict.parse(editor.value)}catch(error){count.textContent=error.message;save.disabled=true;return}
  count.textContent=blocks.length?`남은 충돌 ${blocks.length}개`:'모든 충돌을 선택했습니다.';save.disabled=!!blocks.length;
  blocks.forEach((block,index)=>{
   const card=el('section',undefined,'conflict-block'),header=el('div',undefined,'conflict-block-header');header.append(el('strong',`충돌 ${index+1}`));
   for(const [choice,label] of [['ours','왼쪽 사용'],['theirs','오른쪽 사용'],['both','양쪽 사용']]){
    const button=el('button',label);button.type='button';button.onclick=()=>{snapshots.push(editor.value);editor.value=PgitConflict.resolve(editor.value,index,choice);draw()};header.append(button);
   }
   const sides=el('div',undefined,'conflict-block-sides');
   for(const [label,text] of [[block.leftLabel,block.ours],[block.rightLabel,block.theirs]]){const side=el('div');side.append(el('code',label,'literal-data'),el('pre',text||'∅'));sides.append(side)}
   card.append(header,sides);if(block.base!==null){const base=el('details');base.append(el('summary','공통 조상'),el('pre',block.base||'∅'));card.append(base)}list.append(card);
  });
 }
 undo.onclick=()=>{if(snapshots.length){editor.value=snapshots.pop();draw()}};
 editor.addEventListener('input',()=>{snapshots=[];draw()});draw();
}
