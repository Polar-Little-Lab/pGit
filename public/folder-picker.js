// Native folder selection shared by project and worktree forms.
window.PgitFolderPicker=(()=>{
 function desktop(){if(window.pgitDesktop)return window.pgitDesktop;try{if(parent!==window&&parent.location.origin===location.origin)return parent.pgitDesktop}catch{}return null}
 async function choose({title,defaultPath}={}){const bridge=desktop();if(!bridge)return null;return bridge.chooseFolder({title:window.PgitI18n?.t(title)||title,defaultPath})}
 function mount({input,submit,error,url}){
  if(!desktop())return;
  const row=document.createElement('div');row.className='folder-picker-field';
  const browse=document.createElement('button');browse.type='button';browse.textContent='찾아보기';
  input.before(row);row.append(input,browse);input.readOnly=true;submit.disabled=!input.value;
  let parentPath='',nameEdited=false,name;
  const update=()=>{
   if(!url)return;
   if(!nameEdited)name.value=url.value.trim().replace(/[?#].*$/,'').replace(/\/+$/,'').split(/[/:\\]/).pop().replace(/\.git$/i,'');
   const valid=!!name.value.trim()&&!/[\\/:*?"<>|]/.test(name.value)&&!['.','..'].includes(name.value.trim());
   name.setCustomValidity(valid?'':(window.PgitI18n?.t('폴더 이름을 확인하세요.')||'폴더 이름을 확인하세요.'));
   input.value=parentPath&&valid?parentPath.replace(/[\\/]$/,'')+(parentPath.includes('\\')?'\\':'/')+name.value.trim():'';
   input.title=input.value;submit.disabled=!input.value;
  };
  if(url){
   const label=document.createElement('label');label.textContent='폴더 이름';name=document.createElement('input');name.id=input.id+'-name';name.required=true;label.htmlFor=name.id;
   row.before(label,name);row.before(input.labels[0]);name.addEventListener('input',()=>{nameEdited=!!name.value;update()});url.addEventListener('input',update);update();
  }
  browse.onclick=async()=>{
   browse.disabled=true;
   try{
    const selected=await choose({title:'프로젝트 폴더',defaultPath:parentPath||input.value||undefined});
    if(selected&&row.isConnected){if(url){parentPath=selected;update()}else{input.value=selected;input.title=selected;submit.disabled=false}error.textContent='';input.dispatchEvent(new Event('change',{bubbles:true}))}
   }catch(e){error.textContent=e.message}finally{browse.disabled=false}
  };
 }
 return {available:()=>!!desktop(),choose,mount};
})();
