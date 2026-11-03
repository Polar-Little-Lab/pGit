function renderMergePreview(host,result,{showRefs=true}={}){
 host.replaceChildren();host.className='merge-preview';host.dataset.status=result.status;
 const titles={upToDate:'이미 현재 브랜치에 포함되어 있습니다.',fastForward:'충돌 없이 병합할 수 있습니다.',clean:'자동 병합할 수 있습니다.',conflicts:'병합 충돌이 예상됩니다.',unrelated:'공통 이력이 없어 병합할 수 없습니다.'};
 const heading=el('div',undefined,'merge-result-heading');heading.append(PgitIcons.icon(['upToDate','fastForward','clean'].includes(result.status)?'check':'changes'),el('strong',titles[result.status]));host.append(heading);
 if(result.status==='fastForward')host.append(el('p','새 병합 커밋 없이 현재 브랜치를 최신 커밋으로 이동합니다.'));
 if(result.status==='clean')host.append(el('p','두 브랜치의 변경을 합친 병합 커밋을 만듭니다.'));
 if(result.status==='conflicts')host.append(el('p','병합 후 충돌한 파일을 해결해야 합니다.'));
 if(showRefs)host.append(el('p',result.ref+' → '+result.branch,'literal-data'));
 if(result.dirty)host.append(el('p','작업 중인 변경은 검사에 포함되지 않습니다. 병합 전 커밋하거나 스태시에 보관하세요.','merge-dirty-notice'));
 if(result.files.length){const list=el('ul');for(const name of result.files)list.append(el('li',name,'literal-data'));host.append(list)}
 const details=el('details');details.append(el('summary','상세 결과'),el('code',result.target.slice(0,10)+' → '+result.head.slice(0,10),'literal-data'));
 for(const item of result.messages.filter(m=>m.type.startsWith('CONFLICT')))details.append(el('pre',item.message));host.append(details);
}
const previewOpenCommand=openCommand;openCommand=async function(key){
 await previewOpenCommand(key);if(!['merge','mergePreview'].includes(key))return;
 const form=panel.querySelector('form'),input=form?.querySelector('[name=ref]');if(!form||!input)return;
 const output=el('section');output.hidden=true;output.setAttribute('aria-live','polite');
 const submit=form.querySelector('[type=submit]'),run=key==='mergePreview'?submit:el('button','병합 전 충돌 검사');
 let version=0,timer;panel.addEventListener('close',()=>{clearTimeout(timer);version++},{once:true});
 if(key==='mergePreview'){run.textContent='검사';form.append(output)}else{
  form.classList.add('merge-form');submit.textContent='병합';run.type='button';
  const flow=el('div',undefined,'merge-branch-flow'),source=el('section',undefined,'merge-branch-card'),target=el('section',undefined,'merge-branch-card merge-destination');
  const label=form.querySelector('label');label.textContent='가져올 브랜치';const control=input.closest('.frost-select')||input;
  control.querySelector?.('[role=combobox]')?.setAttribute('aria-label','가져올 브랜치');source.append(label,control);const name=el('strong',state.branch,'literal-data');name.prepend(PgitIcons.icon('branch'));target.append(el('span','현재 브랜치'),name,el('small','변경을 받는 브랜치'));flow.append(source,PgitIcons.icon('right'),target);
  const footer=el('div',undefined,'merge-form-actions');footer.append(run,submit);const help=form.querySelector('[data-command-help]');help.after(flow);form.append(output,footer);
  const originalSubmit=form.onsubmit;form.onsubmit=event=>{if(submit.disabled){event.preventDefault();return}return originalSubmit(event)};
  // Do not initially offer merging the current branch into itself.
  const current=[...input.options].find(o=>o.value===state.branch);if(current){current.disabled=true;if(input.value===state.branch){const choice=[...input.options].find(o=>!o.disabled);input.value=choice?.value||'';input.dispatchEvent(new Event('change',{bubbles:true}))}}
 }
 run.classList.add('preview-run');
 input.addEventListener('change',()=>{version++;output.hidden=true;delete form.mergePreview;if(key==='merge'){submit.disabled=true;clearTimeout(timer);timer=setTimeout(()=>inspect(),150)}});
 async function inspect(event){event?.preventDefault();clearTimeout(timer);if(working)return;if(!input.value){run.disabled=true;return;}const request=++version,ref=input.value;run.disabled=true;if(key==='merge')submit.disabled=true;output.hidden=false;output.className='merge-preview';output.textContent='병합 가능 여부를 검사하는 중…';delete form.mergePreview;
  try{const result=await api('mergePreview',{ref});if(!form.isConnected||request!==version)return;form.mergePreview=result;renderMergePreview(output,result,{showRefs:key!=='merge'});if(key==='merge')submit.disabled=result.dirty||['upToDate','unrelated'].includes(result.status)}catch(error){if(form.isConnected&&request===version){output.className='merge-preview command-error';output.textContent=error.message;if(key==='merge')submit.disabled=!!state.files.length}}
  finally{if(form.isConnected&&request===version)run.disabled=input.disabled}
 }
 if(key==='mergePreview')form.onsubmit=inspect;else{run.onclick=inspect;submit.disabled=true;await inspect()}
};
document.addEventListener('contextmenu',event=>{const button=event.target.closest('.remote-branch');if(!button)return;event.preventDefault();contextActions(button.title,[['mergePreview',{ref:button.dataset.ref}]])});
