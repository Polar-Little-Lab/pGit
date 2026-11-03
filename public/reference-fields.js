// Workflow-specific reference fields reuse the branch and commit controls.
window.PgitReferenceFields=(()=>{
 function branches(snapshot,label,{placeholder=false}={}){
  const select=el('select');select.setAttribute('aria-label',label);
  if(placeholder){const item=el('option','브랜치를 선택하세요');item.value='';select.append(item)}
  for(const [title,items] of [['로컬 브랜치',snapshot.branches.map(b=>({name:b.name,ref:'refs/heads/'+b.name}))],['원격 브랜치',snapshot.refs.filter(r=>r.name.startsWith('refs/remotes/')&&!r.name.endsWith('/HEAD')).map(r=>({name:r.name.slice(13),ref:r.name}))]]){
   const group=el('optgroup');group.label=title;for(const item of items){const option=el('option',item.name);option.value=item.ref;group.append(option)}if(group.children.length)select.append(group);
  }
  select.value=placeholder?'':'refs/heads/'+snapshot.branch;return select;
 }
 function labeled(label,control){const box=el('div',undefined,'reference-field'),lab=el('label',label);control.id=control.id||'reference-'+Math.random().toString(36).slice(2);lab.htmlFor=control.id;box.append(lab,control);return box}
 function mount({key,form,inputs,submit,error,snapshot}){
  if(!['branchCreate','cherryPick'].includes(key))return;
  const commit=inputs.ref,oldLabel=form.querySelector('label[for="'+commit.id+'"]');
  const box=el('section',undefined,'reference-workflow');oldLabel.before(box);oldLabel.remove();
  const commitBox=labeled(key==='branchCreate'?'시작 커밋':'대상 커밋',commit);box.append(commitBox);
  const run=form.onsubmit;let pending=false;
  function busy(value){pending=value;submit.disabled=value;box.setAttribute('aria-busy',String(value))}
  if(key==='branchCreate'){
   submit.textContent='브랜치 만들기';
   const tabs=el('div',undefined,'reference-modes');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','시작점 선택');box.prepend(tabs);
   const branch=branches(snapshot,'기준 브랜치'),branchBox=labeled('기준 브랜치',branch);commitBox.before(branchBox);
   const expression=el('input');expression.type='text';expression.value='HEAD';expression.placeholder='HEAD~2, main, v1.0.0';const expressionBox=labeled('참조 직접 입력',expression);commitBox.after(expressionBox);
   const preview=el('div',undefined,'reference-preview literal-data');preview.setAttribute('aria-live','polite');box.append(preview);
   const check=el('button','참조 확인');check.type='button';expressionBox.append(check);
   let mode='branch',generation=0;
   function update(next){mode=next;generation++;for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.mode===mode));branchBox.hidden=mode!=='branch';commitBox.hidden=mode!=='commit';expressionBox.hidden=mode!=='expression';commit.required=mode==='commit';expression.required=mode==='expression';preview.replaceChildren();error.textContent='';submit.disabled=mode==='commit'&&!commit.value}
   for(const [value,title] of [['branch','브랜치'],['commit','커밋'],['expression','직접 입력']]){const b=el('button',title);b.type='button';b.dataset.mode=value;b.onclick=()=>update(value);tabs.append(b)}
   async function resolve(){return mode==='commit'?await api('commitChoice',{ref:commit.value}):await api('commitChoice',{ref:mode==='branch'?branch.value:expression.value.trim()})}
   check.onclick=async()=>{const version=++generation;check.disabled=true;error.textContent='';try{const c=await resolve();if(version===generation){preview.replaceChildren(el('strong',c.title),el('small',c.hash.slice(0,8)+' · '+c.author))}}catch(e){if(version===generation)error.textContent=e.message}finally{check.disabled=false}};
   expression.oninput=()=>{generation++;preview.replaceChildren();error.textContent=''};
   commit.selectReference=async ref=>{const option=[...branch.options].find(o=>o.value===ref||o.value==='refs/heads/'+ref||o.value==='refs/remotes/'+ref);if(option){branch.value=option.value;branch.dispatchEvent(new Event('change',{bubbles:true}));update('branch')}else{update('commit')}await PgitCommitPicker.select(commit,ref)};
   form.onsubmit=async e=>{e.preventDefault();if(pending)return;busy(true);box.inert=true;error.textContent='';try{const c=await resolve();await PgitCommitPicker.select(commit,c.hash);await run(e)}catch(e){error.textContent=e.message}finally{box.inert=false;busy(false)}};
   update(branch.value?'branch':'commit');return;
  }
  const target=el('div',undefined,'cherry-target');target.append(el('span','적용할 브랜치'),el('strong',snapshot.branch,'literal-data'));box.prepend(target);
  const source=branches(snapshot,'가져올 브랜치',{placeholder:true}),sourceBox=labeled('가져올 브랜치',source);target.after(sourceBox);
  const status=el('p','브랜치를 선택하면 가져올 커밋이 표시됩니다.','reference-status');sourceBox.after(status);
  const list=PgitCommitPicker.mountList(commit,{label:'대상 커밋',onSelect:()=>{submit.disabled=pending||!commit.value}});commitBox.append(list.element);
  submit.textContent='현재 브랜치에 적용';submit.disabled=true;commit.value='';commitBox.hidden=true;let generation=0,sourceHead=null;
  source.onchange=async()=>{if(source.value==='selected')return;source.querySelector('option[value="selected"]')?.remove();const version=++generation;commit.value='';commitBox.hidden=true;sourceHead=null;busy(true);error.textContent='';list.setCommits([],snapshot);status.textContent='불러오는 중…';try{
   if(!source.value){status.textContent='브랜치를 선택하면 가져올 커밋이 표시됩니다.';return}
   const result=await api('commitCandidates',{ref:source.value});if(version!==generation)return;
   sourceHead=result.target;list.setCommits(result.commits,snapshot);commitBox.hidden=!result.commits.length;status.textContent=result.commits.length?(result.limited?'최근 500개 · 현재 브랜치에 없는 커밋':'현재 브랜치에 없는 커밋'):'가져올 커밋이 없습니다.';
  }catch(e){if(version===generation){error.textContent=e.message;status.textContent=''}}finally{if(version===generation){busy(false);submit.disabled=!commit.value}}};
  commit.selectReference=async ref=>{const version=++generation;sourceHead=snapshot.head;busy(true);try{const c=await api('commitChoice',{ref});if(version!==generation)return;let selected=source.querySelector('option[value="selected"]');if(!selected){selected=el('option','선택한 커밋');selected.value='selected';source.append(selected)}source.value='selected';source.dispatchEvent(new Event('change',{bubbles:true}));list.setCommits([c],snapshot);commitBox.hidden=false;await PgitCommitPicker.select(commit,c.hash);list.refresh();status.textContent='선택한 커밋';}finally{if(version===generation)busy(false)}};
  form.onsubmit=async e=>{e.preventDefault();if(pending||!commit.value)return;inputs.expectedHead={value:sourceHead||snapshot.head};inputs.expectedBranch={value:snapshot.branch};await run(e)};
 }
 return {mount,branches};
})();
