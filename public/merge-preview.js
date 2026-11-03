function renderMergePreview(host,result){
 host.replaceChildren();host.className='merge-preview';host.dataset.status=result.status;
 const titles={upToDate:'이미 현재 브랜치에 포함되어 있습니다.',fastForward:'충돌 없이 빠른 앞으로 이동할 수 있습니다.',clean:'자동 병합할 수 있습니다.',conflicts:'병합 충돌이 예상됩니다.',unrelated:'공통 이력이 없어 병합할 수 없습니다.'};
 host.append(el('strong',titles[result.status]),el('p',result.ref+' → '+result.branch,'literal-data'),el('code',result.target.slice(0,10)+' → '+result.head.slice(0,10)));
 if(result.dirty)host.append(el('p','작업 중인 변경은 검사에 포함되지 않습니다. 병합 전 커밋하거나 스태시에 보관하세요.'));
 if(result.files.length){const list=el('ul');for(const name of result.files)list.append(el('li',name,'literal-data'));host.append(list)}
 const conflicts=result.messages.filter(m=>m.type.startsWith('CONFLICT'));
 if(conflicts.length){const details=el('details');details.append(el('summary','상세 결과'));for(const item of conflicts)details.append(el('pre',item.message));host.append(details)}
}
const previewOpenCommand=openCommand;openCommand=async function(key){
 await previewOpenCommand(key);if(!['merge','mergePreview'].includes(key))return;
 const form=panel.querySelector('form'),input=form?.querySelector('[name=ref]');if(!form||!input)return;
 const output=el('section');output.hidden=true;output.setAttribute('aria-live','polite');
 const run=key==='mergePreview'?form.querySelector('[type=submit]'):el('button','병합 전 충돌 검사');
 if(key==='mergePreview')run.textContent='검사';else{run.type='button';form.querySelector('[type=submit]').before(run)}
 run.classList.add('preview-run');form.append(output);let version=0;
 input.addEventListener('change',()=>{version++;output.hidden=true;delete form.mergePreview});
 async function inspect(event){event.preventDefault();if(working)return;const request=++version,ref=input.value;run.disabled=true;output.hidden=false;output.textContent='병합 가능 여부를 검사하는 중…';delete form.mergePreview;
  try{const result=await api('mergePreview',{ref});if(!form.isConnected||request!==version)return;form.mergePreview=result;renderMergePreview(output,result)}catch(error){if(form.isConnected&&request===version){output.className='merge-preview command-error';output.textContent=error.message}}
  finally{if(form.isConnected)run.disabled=input.disabled}
 }
 if(key==='mergePreview')form.onsubmit=inspect;else run.onclick=inspect;
};
document.addEventListener('contextmenu',event=>{const button=event.target.closest('.remote-branch');if(!button)return;event.preventDefault();contextActions(button.title,[['mergePreview',{ref:button.dataset.ref}]])});
